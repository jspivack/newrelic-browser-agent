// Reset config values back to released
window.NREUM.loader_config.agentID = '{{{args.appId}}}'
window.NREUM.loader_config.applicationID = '{{{args.appId}}}'
window.NREUM.loader_config.licenseKey = '{{{args.licenseKey}}}'
window.NREUM.info.applicationID = '{{{args.appId}}}'
window.NREUM.info.licenseKey = '{{{args.licenseKey}}}'
window.NREUM.init.proxy = {}
window.NREUM.init.session_replay.enabled = true
window.NREUM.init.session_trace.enabled = true

// Session replay entitlements check
try {
  var xhr = new XMLHttpRequest()
  xhr.open('POST', '/graphql')
  xhr.setRequestHeader('cache-control','no-cache')
  xhr.setRequestHeader('content-type', 'application/json; charset=utf-8')
  xhr.setRequestHeader('newrelic-requesting-services','browser-agent')
  xhr.setRequestHeader('pragma','no-cache')

  xhr.send(
    JSON.stringify({
      'query': 'query BrowserSessionReplayUserEntitlementsQuery($names: [String]!) { currentUser { id authorizedAccounts { id entitlements(filter: {names: $names}) { name __typename } __typename } __typename } }',
      'variables': {
        'names': [
          'hipaa',
          'fedramp'
        ]
      }
    })
  )

  xhr.addEventListener('load', function(evt){
    try{
      var entitlementsData = JSON.parse(evt.currentTarget.responseText)
      // call the newrelic api(s) after evaluating entitlements...
      var canRunSr = true
      if (entitlementsData.data && entitlementsData.data.currentUser && entitlementsData.data.currentUser.authorizedAccounts && entitlementsData.data.currentUser.authorizedAccounts.length) {
        for (var i = 0; i < entitlementsData.data.currentUser.authorizedAccounts.length; i++){
          var ent = entitlementsData.data.currentUser.authorizedAccounts[i]
          if (!ent.entitlements || !ent.entitlements.length) continue
          for (var j = 0; j < ent.entitlements.length; j++){
            if (ent.entitlements[j].name === 'fedramp' || ent.entitlements[j].name === 'hipaa') canRunSr = false
          }
        }
      }
      if (canRunSr && newrelic && !!newrelic.start) newrelic.start('session_replay')
    } catch(e){
      // something went wrong...
      if (!!newrelic && !!newrelic.noticeError) newrelic.noticeError(e)
    }
  })
} catch(err){
  // we failed our mission....
  if (!!newrelic && !!newrelic.noticeError) newrelic.noticeError(err)
}

{{#if (isEnvironment args.environment 'staging')}}
if (!!newrelic && !!newrelic.log) {
  newrelic.log('NRBA postamble executed', {level: 'info'})
  newrelic.log(new Error('NRBA test error'), {level: 'error'})
}
if (!!newrelic && !!newrelic.wrapLogger) {
  newrelic.wrapLogger(console, 'log', {customAttributes: {wrappedFn: 'console.log'}, level: 'info'})
  newrelic.wrapLogger(console, 'error', {customAttributes: {wrappedFn: 'console.error'}, level: 'error'})
  newrelic.wrapLogger(console, 'trace', {customAttributes: {wrappedFn: 'console.trace'}, level: 'trace'})
  newrelic.wrapLogger(console, 'warn', {customAttributes: {wrappedFn: 'console.warn'}, level: 'warn'})
  newrelic.wrapLogger(console, 'info', {customAttributes: {wrappedFn: 'console.info'}, level: 'info'})
  newrelic.wrapLogger(console, 'debug', {customAttributes: {wrappedFn: 'console.debug'}, level: 'debug'})
}
if (!!newrelic && !!newrelic.setApplicationVersion) newrelic.setApplicationVersion( '' + Math.floor(Math.random() * 10) + '.' + Math.floor(Math.random() * 10) + '.' + Math.floor(Math.random() * 10) )
{{/if}}
