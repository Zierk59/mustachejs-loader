import { expect } from "chai";
import mustacheLoader from "../index.js";
import { read, readFile } from "fs";

describe("MustacheJSLoader", function () {
  describe("Basic run", function () {
    it("runs without errors", function (done) {
      readFile('test/sample.html', 'utf8', async function (err, data) {
        try {
          if (err) {
            done(err);
            return;
          }

          const output = await mustacheLoader.apply({ query: {} }, [data]);
          const module = {};
          eval(output);

          expect(module.exports).to.not.be.undefined;
          expect(module.exports).to.be.a("function");

          const result = await module.exports({ a: 5 });
          const expectation = "<html>\n\
    <head></head>\n\
    <body>\n\
        <div>5</div>\n\
    </body>\n\
</html>\n";
          expect(result).to.be.equal(expectation)
          done();
        }
        catch (e) {
          done(e);
        }
      })
    });

    it("permits dynamic render functions", function (done) {
      readFile('test/sample.html', 'utf8', async function (err, data) {
        try {
          if (err) {
            done(err);
            return;
          }

          const render = function () {
            return { a: 5 };
          };

          const module = {};
          const output = await mustacheLoader.apply({
            query: {
              render: render
            }
          }, [
            data
          ]);

          eval(output);

          expect(module.exports).to.not.be.undefined;
          expect(module.exports).to.be.a("function");

          const result = await module.exports();
          const expectation = "<html>\n\
    <head></head>\n\
    <body>\n\
        <div>5</div>\n\
    </body>\n\
</html>\n";

          expect(result).to.be.equal(expectation)
          done();
        }
        catch (e) {
          done(e);
        }
      })
    });
  });
  describe("Minify", function () {
    it("runs quickly", function (done) {
      readFile('test/sample.html', 'utf8', async function (err, data) {
        try {
          if (err) {
            done(err);
            return;
          }

          const module = {};
          const output = await mustacheLoader.apply({
            query: "?minify" }, [data]);

          eval(output);

          expect(module.exports).to.not.be.undefined;
          expect(module.exports).to.be.a("function");

          const result = await module.exports({ a: 5 });
          const expected = "<html><head></head><body><div>5</div></body></html>";

          expect(result).to.be.equal(expected)
          done();
        }
        catch (e) {
          done(e);
        }
      })
    });

    it("do not delete comments", function (done) {
      readFile('test/sample-comments.html', 'utf8', async function (err, data) {
        try {
          if (err) {
            done(err);
            return;
          }

          const output = await mustacheLoader.apply(
            { query: { minify: { removeComments: false } } }, [data]);

          const module = {};
          eval(output);

          expect(module.exports).to.not.be.undefined;
          expect(module.exports).to.be.a("function");

          const result = await module.exports({ a: 5 });
          const expectation = "<html><head></head><body><!-- This is example comment --><div>5</div></body></html>";

          expect(result).to.be.equal(expectation);
          done();
        }
        catch (e) {
          done(e);
        }
      });
    })
  });
});
