#!/bin/sh
# MongoDB healthcheck script with authentication
mongosh --eval "db.adminCommand('ping')" --quiet \
  -u "${MONGO_ROOT_USERNAME:-admin}" \
  -p "${MONGO_ROOT_PASSWORD:-change-this-password}" \
  --authenticationDatabase admin
