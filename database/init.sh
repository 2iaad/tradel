#!/bin/sh
set -e

# initialize configuration if not
if [ -z "$(ls -A "$DB_DATA" 2>/dev/null)" ]; then
    echo "Initializing database confugiration..."
    
    # initdb creates directory structure and config files for the server that will host databases
    initdb -D "$DB_DATA" \
        --username=postgres \
        --auth-local=trust \
        --auth-host=scram-sha-256 \
        --encoding=UTF8

    # allow external connections
    echo "listen_addresses = '*'" >> "$DB_DATA/postgresql.conf"
    echo "host all all 0.0.0.0/0 scram-sha-256" >> "$DB_DATA/pg_hba.conf"

    # start temporarily to create user + db
    pg_ctl -D "$DB_DATA" -o "-c listen_addresses=''" -w start

    psql -v ON_ERROR_STOP=1 --username postgres <<-EOSQL
        CREATE USER $DB_USER WITH SUPERUSER PASSWORD '$DB_PASSWORD';
        CREATE DATABASE $DB_NAME OWNER $DB_USER;
EOSQL

    pg_ctl -D "$DB_DATA" -m fast -w stop
    echo "Initialization done."
fi

# run postgres in foreground as pid 1
exec postgres -D "$DB_DATA"