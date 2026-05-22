"""
Hostinger SFTP & FTP Deploy Script
Tries SFTP first (ports 65002, 22), falls back to FTP (port 21).
Uploads all files from local ./dist/ to remote directory.
"""
import ftplib
import os
import sys

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
    for item in sorted(os.listdir(local_path)):
        lp = os.path.join(local_path, item)
        if os.path.isfile(lp):
            try:
                with open(lp, 'rb') as f:
                    ftp.storbinary(f'STOR {item}', f)
                if verbose:
                    size = os.path.getsize(lp)
                    print(f'  ✓ {item} ({size:,} bytes)')
                success += 1
            except Exception as e:
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
    for item in sorted(os.listdir(local_path)):
        lp = os.path.join(local_path, item)
        rp = f"{remote_path}/{item}" if remote_path not in ('.', '') else item
        
        if os.path.isfile(lp):
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
        print(f"SFTP Connection established. Current working directory: {sftp.getcwd()}")
        
        # Check possible document root directories
        possible_paths = [
            'domains/quantumqbit.in/public_html',
            'public_html',
            '.'
        ]
        
        target_dir = '.'
        for p in possible_paths:
            try:
                sftp.chdir(p)
                print(f"Successfully changed SFTP directory to: {sftp.getcwd()}")
                target_dir = sftp.getcwd()
                break
            except IOError:
                continue
                
        print("\n=== CURRENT REMOTE FILES ===")
        try:
            print(sftp.listdir(target_dir))
        except Exception as e:
            print(f"Could not list directory contents: {e}")
        
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

        # Show FTP root
        print("\n=== FTP ROOT ===")
        ftp.retrlines('LIST')

        # Navigate to public_html
        print("\nNavigating to public_html...")
        try:
            ftp.cwd('public_html')
            print(f"Now in: {ftp.pwd()}")
        except ftplib.error_perm as e:
            print(f"Could not change directory to public_html: {e}")
            print("Deploying to the current root directory.")

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
