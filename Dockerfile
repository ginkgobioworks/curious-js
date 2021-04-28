FROM node:latest

MAINTAINER Misha Wolfson <misha@ginkgobioworks.com>

# Last update, to invalidate cache if needed
ENV LAST_UPDATE 2016-09-30

ENV CURIOUS_JS_DIR /usr/src/curious-js
WORKDIR $CURIOUS_JS_DIR

COPY package.json rollup.config.js curious.js README.md .
COPY scripts ./scripts
COPY tests ./tests

RUN npm install

# Development files
COPY .eslintrc.yaml .

ENTRYPOINT ["npm", "run"]
CMD ["test"]
