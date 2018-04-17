const supertest = require('supertest');
const nock = require('nock');

const { probot, models } = require('.');
const fixtures = require('../fixtures');

const request = supertest.agent(probot.server);

const {
  SlackWorkspace, SlackUser, GitHubUser, Subscription, Installation,
} = models;

describe('Integration: api', () => {
  describe('authenticated user', () => {
    let installation;
    let workspace;
    let githubUser;
    let slackUser;

    beforeEach(async () => {
      // Create an installation
      installation = await Installation.create({
        githubId: 1,
        ownerId: fixtures.org.id,
      });

      // create user
      githubUser = await GitHubUser.create({
        id: 2,
        accessToken: 'github-token',
      });
      workspace = await SlackWorkspace.create({
        slackId: 'T0001',
        accessToken: 'xoxp-token',
      });
      slackUser = await SlackUser.create({
        slackId: 'U2147483697',
        slackWorkspaceId: workspace.id,
        githubId: githubUser.id,
      });
    });

    test('posting a message', async () => {
      await Subscription.subscribe({
        githubId: fixtures.repo.id,
        channelId: 'C001',
        slackWorkspaceId: workspace.id,
        installationId: installation.id,
        creatorId: slackUser.id,
      });

      nock('https://api.github.com').get('/repos/owner/repo').reply(200, fixtures.repo);
      nock('https://slack.com').post('/api/chat.postMessage').reply(200, { ok: true });

      await request.post('/repos/owner/repo').send({ text: 'hello world' })
        .expect(200, { ok: true });
    });
  });
});
