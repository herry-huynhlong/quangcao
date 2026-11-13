import { MetaService } from './meta.service';

describe('MetaService OAuth safety', () => {
  const previousOrigin=process.env.WEB_ORIGIN; const previousKey=process.env.APP_ENCRYPTION_KEY;
  beforeEach(()=>{process.env.WEB_ORIGIN='https://ads.qavio.site';process.env.APP_ENCRYPTION_KEY=Buffer.alloc(32,7).toString('base64');});
  afterAll(()=>{process.env.WEB_ORIGIN=previousOrigin;process.env.APP_ENCRYPTION_KEY=previousKey;});

  it('generates an OAuth URL containing state and ads_read but never the app secret', async () => {
    const db={query:jest.fn()}; const service=new MetaService(db as never); const encrypted=(service as never as {encrypt(value:string):string}).encrypt('app-secret');
    db.query.mockResolvedValueOnce({rows:[{client_id:'app-id',secret_encrypted:encrypted,api_version:'v27.0'}]}).mockResolvedValueOnce({rows:[]});
    const result=await service.start('00000000-0000-0000-0000-000000000001');
    expect(result.authorizationUrl.startsWith('https://www.facebook.com/v27.0/dialog/oauth?')).toBe(true);
    expect(result.authorizationUrl).toContain('scope=ads_read%2Cads_management');
    expect(result.authorizationUrl).toContain('redirect_uri=https%3A%2F%2Fads.qavio.site%2Fapi%2Fv1%2Fmeta%2Foauth%2Fcallback');
    expect(result.authorizationUrl).not.toContain('app-secret');
    expect(result.authorizationUrl).toMatch(/state=/);
  });

  it('rejects a callback without a matching state before exchanging a code', async () => {
    const db={query:jest.fn(),transaction:jest.fn(async(fn:(client:{query:jest.Mock})=>Promise<unknown>)=>fn({query:jest.fn().mockResolvedValue({rows:[]})}))};
    const service=new MetaService(db as never);
    await expect(service.callback('forged-state','authorization-code',undefined,undefined)).resolves.toEqual({redirect:'https://ads.qavio.site/app/meta?oauth=error'});
    expect(db.query).not.toHaveBeenCalled();
  });

  it('reports an expired stored token instead of connected', async () => {
    const db={query:jest.fn().mockResolvedValueOnce({rows:[{client_id:'app-id',secret_encrypted:'encrypted',api_version:'v27.0'}]}).mockResolvedValueOnce({rows:[{id:'connection',token_encrypted:'encrypted',token_subject_id:null,token_expires_at:new Date(Date.now()-1_000),granted_scopes:['ads_read'],status:'CONNECTED',last_checked_at:null,last_error:null,disconnected_at:null}]}).mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[]})};
    const service=new MetaService(db as never); const status=await service.status('00000000-0000-0000-0000-000000000001');
    expect(status.connection.status).toBe('TOKEN_EXPIRED');
  });
});
