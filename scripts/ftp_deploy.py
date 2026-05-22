"""
Hostinger FTP Deploy Script
Uploads all files from local ./dist/ to remote public_html/
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

def upload_dir(ftp, local_path, verbose=True):
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
                s, f = upload_dir(ftp, lp, verbose)
                success += s
                failed += f
                ftp.cwd('..')
            except Exception as e:
                print(f'  ✗ FAILED entering dir {item}: {e}')
                failed += 1
    return success, failed

def main():
    raw_host = get_env('FTP_HOST_RAW')
    user     = get_env('FTP_USER')
    password = get_env('FTP_PASS')
    host     = clean_host(raw_host)

    print(f"Host:    {host}")
    print(f"User:    {user}")
    print(f"Port:    21")
    print()

    # Connect
    print("Connecting to FTP server...")
    ftp = ftplib.FTP()
    ftp.connect(host, 21, timeout=60)
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

    print("\n=== public_html CURRENT FILES ===")
    ftp.retrlines('LIST')
    print()

    # Upload dist/ contents
    dist_path = os.path.join(os.getcwd(), 'dist')
    if not os.path.exists(dist_path):
        print(f"ERROR: dist/ directory not found at {dist_path}")
        sys.exit(1)

    file_count = sum(len(fs) for _, _, fs in os.walk(dist_path))
    print(f"Uploading {file_count} files from: {dist_path}")
    print("=" * 50)

    ok, err = upload_dir(ftp, dist_path)

    print()
    print("=" * 50)
    print(f"Upload complete: {ok} succeeded, {err} failed")

    if err > 0:
        print("WARNING: Some files failed to upload!")
        sys.exit(1)

    ftp.quit()
    print("FTP connection closed. Deploy done!")

if __name__ == '__main__':
    main()
