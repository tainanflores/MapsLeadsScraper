const { ipcRenderer, require } = window.electron;


const getmac = require('getmac');
const crypto = require('crypto');

$(document).ready(function () {

    $("#registerForm").submit(function (e) {
        e.preventDefault();

        // Obter o email do usuário do formulário
        const email = $("#email").val();

        // Obter o endereço MAC da máquina
        getmac.getMac(function (err, macAddress) {
            if (err) {
                console.error("Erro ao obter o endereço MAC:", err);
                return;
            }

            // Gerar a senha usando o email e o endereço MAC
            const senha = generatePassword(email, macAddress);

            // Aqui você pode implementar a lógica para enviar o email e a senha ao cadastro no Firebase
            console.log("Email:", email);
            console.log("Senha:", senha);

            // Após a conclusão do registro, redirecione para a página de login
            window.location.href = "login.html";
        });
    });

    // Função para gerar a senha com base no email e no endereço MAC
    function generatePassword(email, macAddress) {
        // Concatenar o email e o endereço MAC
        const combinedString = email + macAddress;

        // Gerar o hash da senha usando o algoritmo SHA256
        const hash = crypto.createHash('sha256').update(combinedString).digest('hex');

        // Retornar a senha gerada
        return hash;
    }

});