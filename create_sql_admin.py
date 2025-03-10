import os
import bcrypt
import uuid

def create_superuser():
    # Generate a new UUID for the superuser
    superuser_id = str(uuid.uuid4())
    username = "admin"
    email = "admin@example.com"
    password = "admin123"  # Plain text password

    # Generate a bcrypt hash for the password
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    password_hash = hashed.decode('utf-8')
    role = "superuser"
    
    # Construct the SQL command (using double quotes for identifiers and single quotes for values)
    sql = (
        f'INSERT INTO "users" ("id", "username", "email", "password", "role", "createdAt", "updatedAt") '
        f"VALUES ('{superuser_id}', '{username}', '{email}', '{password_hash}', '{role}', NOW(), NOW());"
    )
    
    # Database connection parameters
    db_name = "ai_caring"   # your database name
    db_user = "azakaria"    # your PostgreSQL user
    
    # Use single quotes around the SQL command in the shell command
    command = f"psql -U {db_user} -d {db_name} -c '{sql}'"
    
    print("Running command:")
    print(command)
    
    result = os.system(command)
    
    if result == 0:
        print("Superuser created successfully.")
    else:
        print("Error creating superuser. Please check the output above for details.")

if __name__ == "__main__":
    create_superuser()
