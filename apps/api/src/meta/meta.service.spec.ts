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

  it('keeps an active Admin connection connected when an unused OAuth state is pending', async () => {
    const future=new Date(Date.now()+60_000);
    const db={query:jest.fn().mockResolvedValueOnce({rows:[{client_id:'app-id',secret_encrypted:'encrypted',api_version:'v27.0'}]}).mockResolvedValueOnce({rows:[{id:'connection',token_encrypted:'encrypted',token_subject_id:null,token_expires_at:future,granted_scopes:['ads_read'],status:'CONNECTED',last_checked_at:null,last_error:null,disconnected_at:null}]}).mockResolvedValueOnce({rows:[{expires_at:future}]}).mockResolvedValueOnce({rows:[]})};
    const service=new MetaService(db as never); const status=await service.status('00000000-0000-0000-0000-000000000001');
    expect(status.connection.status).toBe('CONNECTED');
    expect(status.connection.hasPendingOAuth).toBe(true);
  });

  it('rejects a Page OAuth token issued to a different configured Meta App', async () => {
    const db={query:jest.fn().mockResolvedValue({rows:[]})}; const service=new MetaService(db as never); const internals=service as never as Record<string,jest.Mock>;
    jest.spyOn(internals,'consumeState').mockResolvedValue({userId:'user-a',managerSessionId:null,returnPath:'META_MANAGER',oauthMode:'PAGE'});
    jest.spyOn(internals,'config').mockResolvedValue({clientId:'qavio-app',secret:'server-secret',version:'v27.0'});
    jest.spyOn(internals,'graph').mockResolvedValueOnce({access_token:'short-token'}).mockResolvedValueOnce({access_token:'long-token'});
    jest.spyOn(internals,'verifiedToken').mockResolvedValue({data:{is_valid:true,app_id:'another-app',user_id:'meta-user'}});
    const saved=jest.spyOn(internals,'upsertPageConnection');

    await expect(service.callback('state','code',undefined,undefined)).resolves.toEqual({redirect:'https://ads.qavio.site/app/meta/manager?oauth=error'});
    expect(saved).not.toHaveBeenCalled();
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('META_OAUTH_FAILED'),expect.any(Array));
  });

  it('verifies the Page list through Graph API before saving Page OAuth as connected', async () => {
    const db={query:jest.fn().mockResolvedValue({rows:[]})}; const service=new MetaService(db as never); const internals=service as never as Record<string,jest.Mock>;
    jest.spyOn(internals,'consumeState').mockResolvedValue({userId:'user-a',managerSessionId:null,returnPath:'META_MANAGER',oauthMode:'PAGE'});
    jest.spyOn(internals,'config').mockResolvedValue({clientId:'qavio-app',secret:'server-secret',version:'v27.0'});
    const graph=jest.spyOn(internals,'graph').mockResolvedValueOnce({access_token:'short-token'}).mockResolvedValueOnce({access_token:'long-token'}).mockResolvedValueOnce({data:[]});
    jest.spyOn(internals,'verifiedToken').mockResolvedValue({data:{is_valid:true,app_id:'qavio-app',user_id:'meta-user',expires_at:1_900_000_000}});
    jest.spyOn(internals,'permissions').mockResolvedValue(['pages_show_list','pages_read_engagement']);
    const saved=jest.spyOn(internals,'upsertPageConnection').mockResolvedValue({id:'page-connection'});

    await expect(service.callback('state','code',undefined,undefined)).resolves.toEqual({redirect:'https://ads.qavio.site/app/meta/manager?oauth=success'});
    expect(graph).toHaveBeenLastCalledWith('v27.0','me/accounts',{fields:'id',limit:'1',access_token:'long-token'});
    expect(saved).toHaveBeenCalledWith('user-a','long-token','meta-user',expect.any(Date),['pages_show_list','pages_read_engagement'],'CONNECTED',null);
  });

  it('does not save Page OAuth when the Meta Page-list preflight fails', async () => {
    const db={query:jest.fn().mockResolvedValue({rows:[]})}; const service=new MetaService(db as never); const internals=service as never as Record<string,jest.Mock>;
    jest.spyOn(internals,'consumeState').mockResolvedValue({userId:'user-a',managerSessionId:null,returnPath:'META_MANAGER',oauthMode:'PAGE'});
    jest.spyOn(internals,'config').mockResolvedValue({clientId:'qavio-app',secret:'server-secret',version:'v27.0'});
    jest.spyOn(internals,'graph').mockResolvedValueOnce({access_token:'short-token'}).mockResolvedValueOnce({access_token:'long-token'}).mockRejectedValueOnce(new Error('Meta denied pages list'));
    jest.spyOn(internals,'verifiedToken').mockResolvedValue({data:{is_valid:true,app_id:'qavio-app',user_id:'meta-user'}});
    jest.spyOn(internals,'permissions').mockResolvedValue(['pages_show_list']);
    const saved=jest.spyOn(internals,'upsertPageConnection');

    await expect(service.callback('state','code',undefined,undefined)).resolves.toEqual({redirect:'https://ads.qavio.site/app/meta/manager?oauth=error'});
    expect(saved).not.toHaveBeenCalled();
  });
});
