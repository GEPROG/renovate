import { PlatformId } from '../../constants';
import { bootstrap } from '../../proxy';
import * as hostRules from '../host-rules';
import { applyHostRules } from './host-rules';

const url = 'https://github.com';

jest.mock('global-agent');

describe('util/http/host-rules', () => {
  const options = {
    hostType: PlatformId.Github,
  };
  beforeEach(() => {
    // reset module
    jest.resetAllMocks();

    delete process.env.HTTP_PROXY;

    // clean up hostRules
    hostRules.clear();
    hostRules.add({
      hostType: PlatformId.Github,
      token: 'token',
    });
    hostRules.add({
      hostType: PlatformId.Gitea,
      password: 'password',
    });

    hostRules.add({
      hostType: 'npm',
      authType: 'Basic',
      token: 'XXX',
    });

    hostRules.add({
      hostType: PlatformId.Gitlab,
      token: 'abc',
    });

    hostRules.add({
      hostType: 'github-releases',
      username: 'some',
      password: 'xxx',
    });

    hostRules.add({
      hostType: PlatformId.Bitbucket,
      token: 'cdef',
    });
  });

  afterEach(() => {
    delete process.env.HTTP_PROXY;
  });

  it('adds token', () => {
    expect(applyHostRules(url, { ...options })).toMatchInlineSnapshot(`
      Object {
        "context": Object {
          "authType": undefined,
        },
        "hostType": "github",
        "token": "token",
      }
    `);
  });

  it('adds auth', () => {
    expect(applyHostRules(url, { hostType: PlatformId.Gitea }))
      .toMatchInlineSnapshot(`
      Object {
        "hostType": "gitea",
        "password": "password",
        "username": undefined,
      }
    `);
  });

  it('adds custom auth', () => {
    expect(applyHostRules(url, { hostType: 'npm' })).toMatchInlineSnapshot(`
      Object {
        "context": Object {
          "authType": "Basic",
        },
        "hostType": "npm",
        "token": "XXX",
      }
    `);
  });

  it('skips', () => {
    expect(applyHostRules(url, { ...options, token: 'xxx' }))
      .toMatchInlineSnapshot(`
      Object {
        "hostType": "github",
        "token": "xxx",
      }
    `);
  });

  it('uses http2', () => {
    hostRules.add({ enableHttp2: true });
    expect(applyHostRules(url, { ...options, token: 'xxx' }))
      .toMatchInlineSnapshot(`
      Object {
        "hostType": "github",
        "http2": true,
        "token": "xxx",
      }
    `);
  });

  it('disables http2', () => {
    process.env.HTTP_PROXY = 'http://proxy';
    bootstrap();
    hostRules.add({ enableHttp2: true });
    expect(applyHostRules(url, { ...options, token: 'xxx' }))
      .toMatchInlineSnapshot(`
      Object {
        "hostType": "github",
        "token": "xxx",
      }
    `);
  });

  it('noAuth', () => {
    expect(applyHostRules(url, { ...options, noAuth: true }))
      .toMatchInlineSnapshot(`
      Object {
        "hostType": "github",
        "noAuth": true,
      }
    `);
  });

  it('no fallback', () => {
    expect(
      applyHostRules(url, { ...options, hostType: 'github-releases' })
    ).toEqual({
      hostType: 'github-releases',
      username: 'some',
      password: 'xxx',
    });
  });

  it('fallback to github', () => {
    expect(applyHostRules(url, { ...options, hostType: 'github-tags' }))
      .toMatchInlineSnapshot(`
      Object {
        "context": Object {
          "authType": undefined,
        },
        "hostType": "github-tags",
        "token": "token",
      }
    `);
  });

  it('no fallback to gitlab', () => {
    hostRules.add({
      hostType: 'gitlab-packages',
      token: 'package-token',
    });
    hostRules.add({
      hostType: 'gitlab-releases',
      token: 'release-token',
    });
    hostRules.add({
      hostType: 'gitlab-tags',
      token: 'tags-token',
    });
    expect(
      applyHostRules(url, { ...options, hostType: 'gitlab-tags' })
    ).toEqual({
      context: {
        authType: undefined,
      },
      hostType: 'gitlab-tags',
      token: 'tags-token',
    });
    expect(
      applyHostRules(url, { ...options, hostType: 'gitlab-releases' })
    ).toEqual({
      context: {
        authType: undefined,
      },
      hostType: 'gitlab-releases',
      token: 'release-token',
    });
    expect(
      applyHostRules(url, { ...options, hostType: 'gitlab-packages' })
    ).toEqual({
      context: {
        authType: undefined,
      },
      hostType: 'gitlab-packages',
      token: 'package-token',
    });
  });

  it('fallback to gitlab', () => {
    expect(
      applyHostRules(url, { ...options, hostType: 'gitlab-tags' })
    ).toEqual({
      context: {
        authType: undefined,
      },
      hostType: 'gitlab-tags',
      token: 'abc',
    });
    expect(
      applyHostRules(url, { ...options, hostType: 'gitlab-releases' })
    ).toEqual({
      context: {
        authType: undefined,
      },
      hostType: 'gitlab-releases',
      token: 'abc',
    });
    expect(
      applyHostRules(url, { ...options, hostType: 'gitlab-packages' })
    ).toEqual({
      context: {
        authType: undefined,
      },
      hostType: 'gitlab-packages',
      token: 'abc',
    });
  });

  it('no fallback to bitbucket', () => {
    hostRules.add({
      hostType: 'bitbucket-tags',
      username: 'some',
      password: 'xxx',
    });
    expect(
      applyHostRules(url, { ...options, hostType: 'bitbucket-tags' })
    ).toEqual({
      hostType: 'bitbucket-tags',
      username: 'some',
      password: 'xxx',
    });
  });

  it('fallback to bitbucket', () => {
    expect(
      applyHostRules(url, { ...options, hostType: 'bitbucket-tags' })
    ).toEqual({
      context: {
        authType: undefined,
      },
      hostType: 'bitbucket-tags',
      token: 'cdef',
    });
  });
});
