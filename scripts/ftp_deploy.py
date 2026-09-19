"""
Hostinger SFTP & FTP Deploy Script
Tries SFTP first (ports 65002, 22), falls back to FTP (port 21).
Uploads all files from local ./dist/ to remote directory.
Detects the correct web root by probing for known files.
Includes robust retry logic, 90s socket timeouts, and automatic reconnection.
"""
import ftplib
import os
import sys
import io
import time

def get_env(key):
    val = os.environ.get(key, '').strip()
    if not val:
        print(f"ERROR: Missing environment variable: {key}")
        sys.exit(1)
    return val

def clean_host(raw):
    """Strip ftp:// prefix and port suffix from hostname"""
    h = raw.strip()
    if '//' in h:
        h = h.split('//')[-1]
    h = h.split(':')[0].strip('/')
    return h

def get_candidate_hosts(host):
    """Return list of candidate hostnames/IPs to try in case primary is blocked/timing out"""
    hosts = [host, 'ftp.hostinger.com', 'ftp.hostinger.in', '82.180.143.80', 'ftp.quantumqbit.in', 'quantumqbit.in']
    seen = set()
    result = []
    for h in hosts:
        ch = clean_host(h)
        if ch and ch not in seen:
            seen.add(ch)
            result.append(ch)
    return result

def upload_file_ftp(ftp_state, item, lp, verbose=True, max_retries=3):
    """Upload a single file with retries and automatic session reconnection on timeout"""
    size = os.path.getsize(lp)
    for attempt in range(1, max_retries + 1):
        try:
            with open(lp, 'rb') as f:
                ftp_state['ftp'].storbinary(f'STOR {item}', f, blocksize=32768)
            if verbose:
                suffix = f' [after retry {attempt}]' if attempt > 1 else ''
                print(f'  ✓ {item} ({size:,} bytes){suffix}')
            return True
        except Exception as e:
            err_str = str(e)
            print(f'  ⚠️ Warning: attempt {attempt}/{max_retries} for {item} failed: {e}')

            # Clean up stale temp file if Hostinger FTP server created .in.filename.
            try:
                temp_name = f".in.{item}."
                ftp_state['ftp'].delete(temp_name)
                print(f'  Cleaned stale temp file: {temp_name}')
            except Exception:
                pass

            if attempt < max_retries:
                time.sleep(2)
                # If network timeout or disconnect occurred, re-establish connection
                if any(term in err_str.lower() for term in ['time', 'timed out', 'connect', 'broken', 'eof', 'closed', 'socket', '10054']):
                    print('  Re-establishing FTP session after timeout/disconnect...')
                    try:
                        ftp_state['reconnect']()
                    except Exception as rc_err:
                        print(f'  Reconnection error: {rc_err}')
            else:
                print(f'  ✗ FAILED {item} after {max_retries} attempts: {e}')
                return False
    return False

def upload_dir_ftp(ftp_state, local_path, verbose=True):
    """Upload all files from local_path to current FTP directory with stateful recovery"""
    success = 0
    failed = 0
    
    protected_files = ['keys.json', 'config.json', 'live_updates.json', 'app-ads.txt', 'blogs.json', 'blogs_v2.json', 'categories.json', 'db.json']
        
    remote_files = []
    try:
        remote_files = ftp_state['ftp'].nlst()
    except Exception:
        pass

    for item in sorted(os.listdir(local_path)):
        lp = os.path.join(local_path, item)
        if os.path.isfile(lp):
            if item in protected_files:
                exists = False
                if item in remote_files or f"./{item}" in remote_files:
                    exists = True
                else:
                    try:
                        ftp_state['ftp'].size(item)
                        exists = True
                    except Exception:
                        pass
                if exists:
                    print(f'  ➖ skipping protected file: {item} (already exists on server)')
                    success += 1
                    continue

            ok = upload_file_ftp(ftp_state, item, lp, verbose=verbose)
            if ok:
                success += 1
            else:
                failed += 1
        elif os.path.isdir(lp):
            # Create remote dir if it doesn't exist
            try:
                ftp_state['ftp'].mkd(item)
            except ftplib.error_perm:
                pass  # Directory already exists
            try:
                ftp_state['ftp'].cwd(item)
                ftp_state['cwd'] = ftp_state['ftp'].pwd()
                print(f'  → entering {item}/')
                s, f = upload_dir_ftp(ftp_state, lp, verbose)
                success += s
                failed += f
                ftp_state['ftp'].cwd('..')
                ftp_state['cwd'] = ftp_state['ftp'].pwd()
            except Exception as e:
                print(f'  ✗ FAILED entering dir {item}: {e}')
                failed += 1
    return success, failed

def upload_dir_sftp(sftp, local_path, remote_path, verbose=True):
    """Upload all files from local_path to remote_path in SFTP"""
    success = 0
    failed = 0
    
    protected_files = ['keys.json', 'config.json', 'live_updates.json', 'app-ads.txt', 'blogs.json', 'blogs_v2.json', 'categories.json', 'db.json']

    remote_files = []
    try:
        remote_files = sftp.listdir(remote_path or '.')
    except Exception:
        pass

    for item in sorted(os.listdir(local_path)):
        lp = os.path.join(local_path, item)
        rp = f"{remote_path}/{item}" if remote_path not in ('.', '') else item
        
        if os.path.isfile(lp):
            if item in protected_files:
                exists = False
                if item in remote_files or f"./{item}" in remote_files:
                    exists = True
                else:
                    try:
                        sftp.stat(rp)
                        exists = True
                    except Exception:
                        pass
                if exists:
                    print(f'  ➖ skipping protected file: {item} (already exists on server)')
                    success += 1
                    continue

            # SFTP put with retries
            uploaded = False
            for attempt in range(1, 4):
                try:
                    sftp.put(lp, rp)
                    if verbose:
                        size = os.path.getsize(lp)
                        suffix = f' [retry {attempt}]' if attempt > 1 else ''
                        print(f'  ✓ {item} ({size:,} bytes) -> {rp}{suffix}')
                    success += 1
                    uploaded = True
                    break
                except Exception as e:
                    if attempt < 3:
                        time.sleep(2)
                    else:
                        print(f'  ✗ FAILED {item}: {e}')
                        failed += 1
        elif os.path.isdir(lp):
            try:
                sftp.mkdir(rp)
            except IOError:
                pass
            try:
                print(f'  → entering {item}/')
                s, f = upload_dir_sftp(sftp, lp, rp, verbose)
                success += s
                failed += f
            except Exception as e:
                print(f'  ✗ FAILED entering dir {item}: {e}')
                failed += 1
    return success, failed

def find_web_root_sftp(sftp):
    candidate_paths = [
        'domains/quantumqbit.in/public_html/dist',
        'domains/quantumqbit.in/public_html',
        'public_html/dist',
        'public_html',
        'htdocs',
        '.',
    ]
    
    print("\n=== DETECTING WEB ROOT ===")
    original_dir = sftp.getcwd() or '/'
    best_match = None

    for p in candidate_paths:
        try:
            sftp.chdir(original_dir)
            sftp.chdir(p)
            cwd = sftp.getcwd()
            files = sftp.listdir('.')
            print(f"  Path '{p}' -> cwd={cwd}, files={files[:10]}")
            
            if 'index.html' in files or 'index.php' in files:
                print(f"  *** MATCH: Found index.html/index.php in '{p}' — this is the web root!")
                best_match = (p, cwd)
                break
            elif best_match is None:
                best_match = (p, cwd)
        except Exception as e:
            print(f"  Path '{p}' not accessible: {e}")

    try:
        sftp.chdir(original_dir)
    except Exception:
        pass

    if best_match:
        path_rel, path_abs = best_match
        print(f"\n=== SELECTED WEB ROOT: {path_abs} (via '{path_rel}') ===")
        sftp.chdir(path_rel)
        return path_abs
    
    print("WARNING: Could not detect web root. Deploying to current directory.")
    return sftp.getcwd() or '.'

def find_web_root_ftp(ftp):
    candidate_paths = [
        'domains/quantumqbit.in/public_html/dist',
        'domains/quantumqbit.in/public_html',
        'public_html/dist',
        'public_html',
        'htdocs',
    ]

    print("\n=== DETECTING FTP WEB ROOT ===")
    root_lines = []
    try:
        ftp.retrlines('LIST', root_lines.append)
        print("FTP root contents:")
        for line in root_lines:
            print(f"  {line}")
    except Exception as e:
        print(f"  Could not list root: {e}")

    for p in candidate_paths:
        try:
            ftp.cwd(p)
            cwd = ftp.pwd()
            listing = []
            try:
                ftp.retrlines('NLST', listing.append)
            except Exception:
                pass
            print(f"  Path '{p}' -> cwd={cwd}, files={listing[:10]}")
            
            if 'index.html' in listing or 'index.php' in listing:
                print(f"  *** MATCH: Found index.html/index.php — web root confirmed at {cwd}")
                return True
        except ftplib.error_perm as e:
            print(f"  Path '{p}' not accessible: {e}")
            try:
                ftp.cwd('/')
            except Exception:
                pass

    print("WARNING: Could not find web root, deploying to current directory.")
    return False

def deploy_sftp(host, user, password, dist_path):
    try:
        import paramiko
    except ImportError:
        print("Paramiko library is not installed. Skipping SFTP attempt.")
        return False

    print("\n=== TRYING SFTP DEPLOYMENT ===")
    candidate_hosts = get_candidate_hosts(host)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    connected = False
    for current_host in candidate_hosts:
        print(f"Trying host: {current_host}")
        for port in (65002, 22):
            try:
                print(f"  Connecting to {current_host}:{port} via SFTP...")
                ssh.connect(current_host, port=port, username=user, password=password, timeout=30, banner_timeout=45, auth_timeout=30)
                print("  SFTP Login successful!")
                connected = True
                break
            except Exception as e:
                print(f"  SFTP Connection failed on {current_host}:{port}: {e}")
        if connected:
            break
            
    if not connected:
        print("SFTP Connection could not be established on any host/port.")
        return False
        
    try:
        sftp = ssh.open_sftp()
        try:
            sftp.get_channel().settimeout(90)
        except Exception:
            pass
        print(f"SFTP Connection established. CWD: {sftp.getcwd()}")
        
        target_dir = find_web_root_sftp(sftp)
        
        file_count = sum(len(fs) for _, _, fs in os.walk(dist_path))
        print(f"\nUploading {file_count} files from: {dist_path} to {target_dir}")
        print("=" * 50)
        
        ok, err = upload_dir_sftp(sftp, dist_path, target_dir)
        print("=" * 50)
        print(f"SFTP Upload complete: {ok} succeeded, {err} failed")
        
        sftp.close()
        ssh.close()
        
        if err > 0:
            print("WARNING: Some files failed to upload over SFTP!")
            sys.exit(1)
        return True
    except Exception as e:
        print(f"SFTP Error occurred during deployment: {e}")
        try:
            ssh.close()
        except Exception:
            pass
        return False

def deploy_ftp(host, user, password, dist_path):
    print("\n=== FALLING BACK TO FTP / FTPS DEPLOYMENT ===")
    candidate_hosts = get_candidate_hosts(host)
    
    ftp = None
    connected = False
    chosen_host = None
    is_ftps = False
    
    for current_host in candidate_hosts:
        print(f"Trying FTP/FTPS Host: {current_host}:21")
        # 1. Try standard FTP with 90-second socket timeout
        try:
            print(f"  [Attempt FTP] Connecting to {current_host}:21 (timeout 90s)...")
            f = ftplib.FTP()
            f.connect(current_host, 21, timeout=90)
            f.login(user, password)
            f.set_pasv(True)
            print("  FTP Login successful!")
            ftp = f
            chosen_host = current_host
            is_ftps = False
            connected = True
            break
        except Exception as e:
            print(f"  FTP connection error on {current_host}: {e}")

        # 2. Try FTPS (FTP over TLS) with 90-second socket timeout
        try:
            print(f"  [Attempt FTPS] Connecting to {current_host}:21 via TLS (timeout 90s)...")
            ftps = ftplib.FTP_TLS()
            ftps.connect(current_host, 21, timeout=90)
            ftps.login(user, password)
            ftps.prot_p()
            ftps.set_pasv(True)
            print("  FTPS Login successful!")
            ftp = ftps
            chosen_host = current_host
            is_ftps = True
            connected = True
            break
        except Exception as e:
            print(f"  FTPS connection error on {current_host}: {e}")

    if not connected or not ftp:
        print("FTP/FTPS Connection failed on all candidate hosts.")
        return False

    ftp_state = {
        'ftp': ftp,
        'host': chosen_host,
        'user': user,
        'password': password,
        'is_ftps': is_ftps,
        'cwd': ''
    }

    def reconnect():
        try:
            ftp_state['ftp'].close()
        except Exception:
            pass
        time.sleep(1)
        if ftp_state['is_ftps']:
            nf = ftplib.FTP_TLS()
            nf.connect(ftp_state['host'], 21, timeout=90)
            nf.login(ftp_state['user'], ftp_state['password'])
            nf.prot_p()
            nf.set_pasv(True)
        else:
            nf = ftplib.FTP()
            nf.connect(ftp_state['host'], 21, timeout=90)
            nf.login(ftp_state['user'], ftp_state['password'])
            nf.set_pasv(True)
        if ftp_state['cwd']:
            try:
                nf.cwd(ftp_state['cwd'])
            except Exception as e:
                print(f"  Could not restore CWD {ftp_state['cwd']}: {e}")
        ftp_state['ftp'] = nf
        return nf

    ftp_state['reconnect'] = reconnect

    try:
        find_web_root_ftp(ftp)
        ftp_state['cwd'] = ftp.pwd()

        print("\n=== FTP CURRENT FILES ===")
        ftp.retrlines('LIST')
        print()

        file_count = sum(len(fs) for _, _, fs in os.walk(dist_path))
        print(f"Uploading {file_count} files from: {dist_path}")
        print("=" * 50)

        ok, err = upload_dir_ftp(ftp_state, dist_path)

        print()
        print("=" * 50)
        print(f"Upload complete: {ok} succeeded, {err} failed")

        if err > 0:
            print("WARNING: Some files failed to upload!")
            sys.exit(1)

        try:
            ftp_state['ftp'].quit()
        except Exception:
            pass
        print("FTP connection closed. Deploy done!")
        return True
    except Exception as e:
        print(f"FTP Error: {e}")
        return False

def main():
    raw_host = get_env('FTP_HOST_RAW')
    user     = get_env('FTP_USER')
    password = get_env('FTP_PASS')
    host     = clean_host(raw_host)

    dist_path = os.path.join(os.getcwd(), 'dist')
    if not os.path.exists(dist_path):
        print(f"ERROR: dist/ directory not found at {dist_path}")
        sys.exit(1)

    sftp_success = deploy_sftp(host, user, password, dist_path)
    if sftp_success:
        print("Deployment completed successfully via SFTP!")
        return

    ftp_success = deploy_ftp(host, user, password, dist_path)
    if ftp_success:
        print("Deployment completed successfully via FTP!")
        return

    print("ERROR: Both SFTP and FTP deployments failed.")
    sys.exit(1)

if __name__ == '__main__':
    main()
