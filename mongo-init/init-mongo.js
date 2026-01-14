// MongoDB initialization script for creating admin user
// This script runs only on first initialization

db = db.getSiblingDB('admin');

const rootUsername = process.env.MONGO_INITDB_ROOT_USERNAME || 'admin';
const rootPassword = process.env.MONGO_INITDB_ROOT_PASSWORD || 'change-this-password';

// Check if admin user exists, if not create it
try {
  const existingUser = db.getUser(rootUsername);
  if (existingUser) {
    // User exists, update password
    db.changeUserPassword(rootUsername, rootPassword);
    print(`✅ Updated password for existing admin user: ${rootUsername}`);
  }
} catch (e) {
  // User doesn't exist, create it
  db.createUser({
    user: rootUsername,
    pwd: rootPassword,
    roles: [
      {
        role: 'root',
        db: 'admin'
      }
    ]
  });
  print(`✅ Created admin user: ${rootUsername}`);
}

// Switch to portfolio database and create application user
db = db.getSiblingDB('portfolio');

const appUsername = process.env.MONGO_APP_USERNAME || 'portfolio_user';
const appPassword = process.env.MONGO_APP_PASSWORD || 'change-this-password';

try {
  const existingAppUser = db.getUser(appUsername);
  if (existingAppUser) {
    db.changeUserPassword(appUsername, appPassword);
    print(`✅ Updated password for existing app user: ${appUsername}`);
  }
} catch (e) {
  db.createUser({
    user: appUsername,
    pwd: appPassword,
    roles: [
      {
        role: 'readWrite',
        db: 'portfolio'
      }
    ]
  });
  print(`✅ Created app user: ${appUsername}`);
}

print('MongoDB users configured successfully');
