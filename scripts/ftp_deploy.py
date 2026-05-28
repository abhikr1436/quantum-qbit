"""
Hostinger SFTP & FTP Deploy Script
Tries SFTP first (ports 65002, 22), falls back to FTP (port 21).
Uploads all files from local ./dist/ to remote directory.
Detects the correct web root by probing for known files.
"""
import ftplib
import os
import sys
import io

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

def upload_dir_ftp(ftp, local_path, verbose=True):
    """Upload all files from local_path to current FTP directory"""
    success = 0
    failed = 0
    
    is_github_actions = os.environ.get('GITHUB_ACTIONS') == 'true'
    protected_files = ['keys.json', 'config.json', 'live_updates.json']
    if not is_github_actions:
        protected_files.append('db.json')
        
    # Get listing once to check for file existence reliably
    remote_files = []
    try:
        remote_files = ftp.nlst()
    except:
        pass

    for item in sorted(os.listdir(local_path)):
        lp = os.path.join(local_path, item)
        if os.path.isfile(lp):
            if item in protected_files:
                exists = False
                if item in remote_files or f"./{item}" in remote_files:
                    exists = True
                else:
                    # Fallback to size check
                    try:
                        ftp.size(item)
                        exists = True
                    except:
                        pass
                if exists:
                    print(f'  ➖ skipping protected file: {item} (already exists on server)')
                    success += 1
                    continue
            try:
                with open(lp, 'rb') as f:
                    ftp.storbinary(f'STOR {item}', f)
                if verbose:
                    size = os.path.getsize(lp)
                    print(f'  ✓ {item} ({size:,} bytes)')
                success += 1
            except Exception as e:
                err_str = str(e)
                if "already exists" in err_str and ".in." in err_str:
                    print(f'  ⚠️ Stale temp file detected for {item}. Attempting to clean and retry...')
                    try:
                        temp_name = f".in.{item}."
                        ftp.delete(temp_name)
                        print(f'  Deleted stale temp file: {temp_name}')
                        with open(lp, 'rb') as f:
                            ftp.storbinary(f'STOR {item}', f)
                        if verbose:
                            size = os.path.getsize(lp)
                            print(f'  ✓ {item} ({size:,} bytes) [after cleanup retry]')
                        success += 1
                        continue
                    except Exception as retry_err:
                        print(f'  ✗ Retry failed for {item}: {retry_err}')
                print(f'  ✗ FAILED {item}: {e}')
                failed += 1
        elif os.path.isdir(lp):
            # Create remote dir if it doesn't exist
            try:
                ftp.mkd(item)
            except ftplib.error_perm:
                pass  # Directory already exists
            try:
                ftp.cwd(item)
                print(f'  → entering {item}/')
                s, f = upload_dir_ftp(ftp, lp, verbose)
                success += s
                failed += f
                ftp.cwd('..')
            except Exception as e:
                print(f'  ✗ FAILED entering dir {item}: {e}')
                failed += 1
    return success, failed

def upload_dir_sftp(sftp, local_path, remote_path, verbose=True):
    """Upload all files from local_path to remote_path in SFTP"""
    success = 0
    failed = 0
    
    is_github_actions = os.environ.get('GITHUB_ACTIONS') == 'true'
    protected_files = ['keys.json', 'config.json', 'live_updates.json']
    if not is_github_actions:
        protected_files.append('db.json')

    remote_files = []
    try:
        remote_files = sftp.listdir(remote_path or '.')
    except:
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
                    except:
                        pass
                if exists:
                    print(f'  ➖ skipping protected file: {item} (already exists on server)')
                    success += 1
                    continue
            try:
                sftp.put(lp, rp)
                if verbose:
                    size = os.path.getsize(lp)
                    print(f'  ✓ {item} ({size:,} bytes) -> {rp}')
                success += 1
            except Exception as e:
                print(f'  ✗ FAILED {item}: {e}')
                failed += 1
        elif os.path.isdir(lp):
            # Create remote directory
            try:
                sftp.mkdir(rp)
            except IOError:
                pass  # Already exists
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
    """
    Detect the correct web root by trying known paths and checking for our
    marker file (index.html) or standard Hostinger layouts.
    Returns the absolute path to the web root.
    """
    # Hostinger shared hosting possible paths, ordered by priority
    candidate_paths = [
        'domains/quantumqbit.in/public_html',
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
            
            # Prefer the path that already has index.html or index.php (our web app)
            if 'index.html' in files or 'index.php' in files:
                print(f"  *** MATCH: Found index.html/index.php in '{p}' — this is the web root!")
                best_match = (p, cwd)
                break
            elif best_match is None:
                # Track first accessible path as fallback
                best_match = (p, cwd)
        except Exception as e:
            print(f"  Path '{p}' not accessible: {e}")

    # Reset to original
    try:
        sftp.chdir(original_dir)
    except:
        pass

    if best_match:
        path_rel, path_abs = best_match
        print(f"\n=== SELECTED WEB ROOT: {path_abs} (via '{path_rel}') ===")
        sftp.chdir(path_rel)
        return path_abs
    
    print("WARNING: Could not detect web root. Deploying to current directory.")
    return sftp.getcwd() or '.'

def find_web_root_ftp(ftp):
    """
    Detect the correct FTP web root.
    Returns True if successfully navigated.
    """
    candidate_paths = [
        'domains/quantumqbit.in/public_html',
        'public_html',
        'htdocs',
    ]

    print("\n=== DETECTING FTP WEB ROOT ===")
    # Show root listing
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
            # List files to probe
            listing = []
            try:
                ftp.retrlines('NLST', listing.append)
            except:
                pass
            print(f"  Path '{p}' -> cwd={cwd}, files={listing[:10]}")
            
            if 'index.html' in listing or 'index.php' in listing:
                print(f"  *** MATCH: Found index.html/index.php — web root confirmed at {cwd}")
                return True
        except ftplib.error_perm as e:
            print(f"  Path '{p}' not accessible: {e}")
            try:
                ftp.cwd('/')
            except:
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
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    connected = False
    # Try Hostinger SSH port 65002 first, then standard port 22
    for port in (65002, 22):
        try:
            print(f"Connecting to {host}:{port} via SFTP...")
            ssh.connect(host, port=port, username=user, password=password, timeout=15)
            print("SFTP Login successful!")
            connected = True
            break
        except Exception as e:
            print(f"SFTP Connection failed on port {port}: {e}")
            
    if not connected:
        print("SFTP Connection could not be established.")
        return False
        
    try:
        sftp = ssh.open_sftp()
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
        except:
            pass
        return False

def deploy_ftp(host, user, password, dist_path):
    print("\n=== FALLING BACK TO FTP DEPLOYMENT ===")
    print(f"Host:    {host}")
    print(f"User:    {user}")
    print(f"Port:    21")
    print()

    # Connect
    print("Connecting to FTP server...")
    try:
        ftp = ftplib.FTP()
        ftp.connect(host, 21, timeout=30)
        print(f"Connected: {ftp.getwelcome()}")

        ftp.login(user, password)
        print("Login successful!")
        ftp.set_pasv(True)

        find_web_root_ftp(ftp)

        print("\n=== FTP CURRENT FILES ===")
        ftp.retrlines('LIST')
        print()

        file_count = sum(len(fs) for _, _, fs in os.walk(dist_path))
        print(f"Uploading {file_count} files from: {dist_path}")
        print("=" * 50)

        ok, err = upload_dir_ftp(ftp, dist_path)

        print()
        print("=" * 50)
        print(f"Upload complete: {ok} succeeded, {err} failed")

        if err > 0:
            print("WARNING: Some files failed to upload!")
            sys.exit(1)

        ftp.quit()
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

    # 1. Try SFTP first
    sftp_success = deploy_sftp(host, user, password, dist_path)
    if sftp_success:
        print("Deployment completed successfully via SFTP!")
        return

    # 2. Fallback to FTP
    ftp_success = deploy_ftp(host, user, password, dist_path)
    if ftp_success:
        print("Deployment completed successfully via FTP!")
        return

    print("ERROR: Both SFTP and FTP deployments failed.")
    sys.exit(1)

if __name__ == '__main__':
    main()
