(function () {
    var status = document.getElementById('status');
    if (!window.supabase) { status.textContent = 'Não foi possível carregar o login. Recarregue a página.'; return; }
    var client = supabase.createClient('https://gcqncqpekdekslfzsfty.supabase.co', 'sb_publishable_7RvweVgQs7cRM2bw0Qx9Qg_UJ1sC-jz', {
        auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true }
    });
    var login = document.getElementById('login'), form = document.getElementById('pair'), logout = document.getElementById('logout');
    var emailForm = document.getElementById('email-login'), email = document.getElementById('email'), password = document.getElementById('password');
    var emailSubmit = document.getElementById('email-submit'), signup = document.getElementById('signup'), forgot = document.getElementById('forgot');
    var code = document.getElementById('code'), approve = document.getElementById('approve');
    code.value = sessionStorage.getItem('vela-pair-code') || '';
    code.oninput = function () { sessionStorage.setItem('vela-pair-code', code.value); };
    function render(session) {
        document.querySelector('.auth-options').hidden = !!session; form.hidden = !session; logout.hidden = !session;
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
    function credentialsValid() {
        if (!email.value || !email.checkValidity() || password.value.length < 6) {
            status.textContent = 'Informe um email válido e uma senha com pelo menos 6 caracteres.'; return false;
        }
        return true;
    }
    emailForm.onsubmit = function (event) {
        event.preventDefault(); if (!credentialsValid()) return;
        emailSubmit.disabled = true; status.textContent = 'Entrando…';
        client.auth.signInWithPassword({ email: email.value.trim(), password: password.value }).then(function (result) {
            if (result.error) throw result.error;
            status.textContent = 'Login realizado.';
        }).catch(function (error) { status.textContent = error.message || 'Não foi possível entrar.'; })
            .finally(function () { emailSubmit.disabled = false; });
    };
    signup.onclick = function () {
        if (!credentialsValid()) return;
        signup.disabled = true; status.textContent = 'Criando sua conta…';
        client.auth.signUp({ email: email.value.trim(), password: password.value, options: { emailRedirectTo: location.href.split('#')[0] } }).then(function (result) {
            if (result.error) throw result.error;
            status.textContent = result.data.session ? 'Conta criada e login realizado.' : 'Conta criada. Confira seu email para confirmar o cadastro.';
        }).catch(function (error) { status.textContent = error.message || 'Não foi possível criar a conta.'; })
            .finally(function () { signup.disabled = false; });
    };
    forgot.onclick = function () {
        if (!email.value || !email.checkValidity()) { status.textContent = 'Informe seu email para receber a recuperação.'; return; }
        forgot.disabled = true; status.textContent = 'Enviando recuperação…';
        client.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: location.href.split('#')[0] }).then(function (result) {
            if (result.error) throw result.error;
            status.textContent = 'Se o email estiver cadastrado, você receberá as instruções de recuperação.';
        }).catch(function (error) { status.textContent = error.message || 'Não foi possível enviar a recuperação.'; })
            .finally(function () { forgot.disabled = false; });
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
