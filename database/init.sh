#!/bin/sh
set -e

# initialize configuration if not
if [ -z "$(ls -A "$PGDATA" 2>/dev/null)" ]; then
    echo "Initializing database confugiration..."
    
    # initdb creates directory structure and config files for the server that will host databases
    initdb -D "$PGDATA" \
        --username=postgres \
        --auth-local=trust \
        --auth-host=scram-sha-256 \
        --encoding=UTF8

    # allow external connections
    echo "listen_addresses = '*'" >> "$PGDATA/postgresql.conf"
    echo "host all all 0.0.0.0/0 scram-sha-256" >> "$PGDATA/pg_hba.conf"

    # start temporarily to create user + db
    pg_ctl -D "$PGDATA" -o "-c listen_addresses=''" -w start

    psql -v ON_ERROR_STOP=1 --username postgres <<-EOSQL
        CREATE USER $POSTGRES_USER WITH SUPERUSER PASSWORD '$POSTGRES_PASSWORD';
        CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;
EOSQL

    pg_ctl -D "$PGDATA" -m fast -w stop
    echo "Initialization done."
fi

# run postgres in foreground as pid 1
exec postgres -D "$PGDATA"