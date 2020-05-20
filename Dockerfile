FROM registry.siteplus.org/nodejs-dev/tools/builder/clean:8.15.0-alpine

ADD . /app
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
RUN chown -R app:app /app
USER app
EXPOSE 8080
ENTRYPOINT ["node", "./bin/www"]
