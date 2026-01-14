// MongoDB initialization script for creating admin user
// This script runs only on first initialization

db = db.getSiblingDB('admin');

// Create admin user with root privileges
db.createUser({
  user: process.env.MONGO_INITDB_ROOT_USERNAME || 'admin',
  pwd: process.env.MONGO_INITDB_ROOT_PASSWORD || 'change-this-password',
  roles: [
    {
      role: 'root',
      db: 'admin'
    }
  ]
});

// Switch to portfolio database and create application user
db = db.getSiblingDB('portfolio');

db.createUser({
  user: process.env.MONGO_APP_USERNAME || 'portfolio_user',
  pwd: process.env.MONGO_APP_PASSWORD || 'change-this-password',
  roles: [
    {
      role: 'readWrite',
      db: 'portfolio'
    }
  ]
});

print('MongoDB users created successfully');
