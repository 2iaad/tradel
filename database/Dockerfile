FROM alpine:3.20

RUN apk add --no-cache postgresql16 postgresql16-contrib

RUN mkdir -p /var/lib/postgresql/data /run/postgresql \
    && chown -R postgres:postgres /var/lib/postgresql /run/postgresql \
    && chmod 700 /var/lib/postgresql/data

COPY init.sh /usr/local/bin/init.sh
RUN chmod +x /usr/local/bin/init.sh

ENV PGDATA=/var/lib/postgresql/data
ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=changeme
ENV POSTGRES_DB=mydb

EXPOSE 5432

USER postgres
ENTRYPOINT ["/usr/local/bin/init.sh"]