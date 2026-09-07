(function () {
    var status = document.getElementById('status');
    if (!window.supabase) { status.textContent = 'Não foi possível carregar o login. Recarregue a página.'; return; }
    var client = supabase.createClient('https://gcqncqpekdekslfzsfty.supabase.co', 'sb_publishable_7RvweVgQs7cRM2bw0Qx9Qg_UJ1sC-jz', {
        auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true }
    });
    var login = document.getElementById('login'), form = document.getElementById('pair'), logout = document.getElementById('logout');
    var code = document.getElementById('code'), approve = document.getElementById('approve');
    code.value = sessionStorage.getItem('vela-pair-code') || '';
    code.oninput = function () { sessionStorage.setItem('vela-pair-code', code.value); };
    function render(session) {
        login.hidden = !!session; form.hidden = !session; logout.hidden = !session;
        document.getElementById('identity').textContent = session ? 'Conectado como ' + session.user.email : '';
    }
    client.auth.onAuthStateChange(function (event, session) { render(session); });
    client.auth.getSession().then(function (result) {
        if (result.error) status.textContent = result.error.message;
        render(result.data.session);
    });
    login.onclick = function () {
        login.disabled = true;
        var redirect = new URL(location.href); redirect.search = ''; redirect.hash = '';
        client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirect.href } }).then(function (result) {
            if (result.error) { status.textContent = result.error.message; login.disabled = false; }
        }).catch(function () { status.textContent = 'Falha de conexão. Tente novamente.'; login.disabled = false; });
    };
    form.onsubmit = function (event) {
        event.preventDefault();
        var value = code.value.replace(/[^a-z0-9]/gi, '').toUpperCase();
        if (!/^[A-F0-9]{12}$/.test(value)) { status.textContent = 'Digite os 12 caracteres exibidos na TV.'; return; }
        approve.disabled = true; status.textContent = 'Vinculando…';
        client.rpc('vela_pair_approve', { code: value }).then(function (result) {
            if (result.error) throw result.error;
            status.textContent = 'TV vinculada! Aguarde alguns segundos na televisão. Você já pode fechar esta página.';
            code.value = ''; sessionStorage.removeItem('vela-pair-code');
        }).catch(function (error) { status.textContent = error.message || 'Não foi possível vincular. Tente novamente.'; })
            .finally(function () { approve.disabled = false; });
    };
    logout.onclick = function () { client.auth.signOut().then(function (result) { if (result.error) status.textContent = result.error.message; }); };
})();
