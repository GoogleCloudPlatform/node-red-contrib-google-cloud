const should = require("should");
const helper = require('node-red-node-test-helper');
const sentimentNode = require('../language-sentiment.js');

helper.init(require.resolve('node-red'));

describe('sentiment Node', () => {
    beforeEach((done) => {
        helper.startServer(done);
    });

    afterEach((done)=> {
        helper.unload();
        helper.stopServer(done);
    });

    it('should be loaded', (done) => {
        const flow = [{id: "n1", type: "XXX", name: "sentiment1"}];
        helper.load(sentimentNode, flow, () => {
            const n1 = helper.getNode("n1");
            done();
        });
    });
});