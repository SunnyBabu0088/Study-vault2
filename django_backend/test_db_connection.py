import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studyvault_django.settings')
django.setup()

from django.db import connection, DatabaseError

def test_connection():
    print("Testing Django PostgreSQL database connection...")
    try:
        connection.ensure_connection()
        is_usable = connection.is_usable()
        db_engine = connection.settings_dict['ENGINE']
        db_name = connection.settings_dict['NAME']
        db_host = connection.settings_dict['HOST']
        db_port = connection.settings_dict['PORT']
        db_user = connection.settings_dict['USER']
        
        print(f"Status: SUCCESS")
        print(f"Engine: {db_engine}")
        print(f"Database Name: {db_name}")
        print(f"Host: {db_host}:{db_port}")
        print(f"User: {db_user}")
        print(f"Connection Usable: {is_usable}")

        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            pg_version = cursor.fetchone()
            print(f"PostgreSQL Server Version: {pg_version[0]}")

            cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
            tables = cursor.fetchall()
            table_names = [t[0] for t in tables]
            print(f"Tables present in '{db_name}': {len(table_names)} tables found ({', '.join(table_names[:5])}...)")

        return True
    except Exception as e:
        print(f"Status: FAILED")
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    if not success:
        sys.exit(1)
