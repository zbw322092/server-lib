const bunyan = require('bunyan');
const each = require('lodash/each');
const isObject = require('lodash/isObject');
const PrettyStream = require('./PrettyStream');

class AppLog {
  constructor(options) {
    options = options || {};

    this.level = options.level;

    this.setSerializers();
  }

  setStdoutStream() {
    let prettyStream = new PrettyStream();
    prettyStream.pipe(process.stdout);

    const log = bunyan.createLogger({
      name: 'stdoutLogger',
      streams: [
        {
          level: this.level || 'info',
          stream: prettyStream
        }
      ],
      serializers: this.serializers
    });

    return log;
  }

  setStderrStream() {
    let prettyStream = new PrettyStream();
    prettyStream.pipe(process.stderr);

    const log = bunyan.createLogger({
      name: 'stdoutLogger',
      streams: [
        {
          level: 'error',
          stream: prettyStream
        }
      ],
      serializers: this.serializers
    });

    return log;
  }

  setSerializers() {
    this.serializers = {
      req: (req) => {
        return {
          meta: {
            requestId: req.requestId,
            userId: req.userId
          },
          url: req.url,
          method: req.method,
          originalUrl: req.originalUrl,
          params: req.params,
          headers: this.removeSensitiveData(req.headers),
          body: this.removeSensitiveData(req.body),
          query: this.removeSensitiveData(req.query)
        };
      },

      res: (res) => {
        return {
          _headers: this.removeSensitiveData(res._headers),
          statusCode: res.statusCode,
          responseTime: res.responseTime
        };
      },

      err: (err) => {
        return {
          id: err.id,
          domain: this.domain,
          code: err.code,
          name: err.errorType,
          statusCode: err.statusCode,
          level: err.level,
          message: err.message,
          context: err.context,
          help: err.help,
          stack: err.stack,
          hideStack: err.hideStack,
          errorDetails: err.errorDetails
        };
      }
    }
  }

  removeSensitiveData(obj) {
    let newObj = {};

    each(obj, (value, key) => {
      try {
        if (isObject(value)) {
          value = this.removeSensitiveData(value);
        }

        if (!key.match(/pin|password|authorization|cookie/gi)) {
          newObj[key] = value;
        }
      } catch (err) {
        newObj[key] = value;
      }
    });

    return newObj;
  }

  info(data) {
    this.setStdoutStream().info(data);
  }

  error(data) {
    this.setStderrStream().error(data);
  }


}

module.exports = AppLog;