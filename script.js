const { ipcRenderer, require } = window.electron;

// Função que cria a div
function criarDivBuscas(id, buscaCompleta, situacao, user, inicio, fim) {

    const progressBarStyle = situacao === "FINALIZADO" ? "display: none;" : "";
    const cor = situacao === "FINALIZADO" ? "green" : "darkslategray";



    var divBuscaHtml = `
        <div id="resultadoBusca" class="container-fluid shadow-lg mb-3 p-3">
            <h5 class="text-left mb-3" style="color: #007bff" id="tituloBusca";"><span style="font-size: 20px"><strong>${id}. </strong></span>${buscaCompleta}</h5>

            <div class="row">
                <div class="col">
                    <strong>Situação:</strong>
                    <span class="d-block mt-2">
                        <span id="situacao" style = "background-color: ${cor}">${situacao}</span>
                    </span>
                </div>
                <div class="col">
                    <strong>Usuário:</strong>
                    <span id="usuario" class="d-block mt-2">${user}</span>
                </div>
                <div class="col">
                    <strong>Iniciado:</strong>
                    <span id="inicio" class="d-block mt-2">${inicio}</span>
                </div>
                <div class="col">
                    <strong>Finalizado:</strong>
                    <span id="fim" class="d-block mt-2">${fim}</span>
                </div>
                <div class="col d-flex align-items-center">
                    <button class="btn btn-primary" data-id="${id}" style="width: 150px" id="verResultadosBtn">Ver Resultados</button>
                    <button class="btn btn-danger ml-2" style="width: 80px" id="excluirBtn">Excluir</button>
                </div>
            </div>

            <div class="progress mt-2" style="${progressBarStyle}">
                <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%; animation-duration: 200ms;"></div>
            </div>
        </div>
    `;

    // Adiciona a div ao body
    $(".minhasBuscas").append(divBuscaHtml);

}

// Função que cria a div
function criarDivLeads(buscas_id, busca, nome, categoria, avaliacao, endereco, website, telefone, exportado, linkMaps, counter) {

    const cor = exportado === "SIM" ? "green" : "red";
    const wzpLink = "http://wa.me/55" + telefone.replace(/\D/g, '');
    var idBusca = buscas_id;

    var tituloBuscaHtml = `<h2 class="text-left id="tituloBusca" ml-4 mt-4">${idBusca}. ${busca}</h2>
    `;
    var quantidadeLeads = `<span id="quantidadeTotalDivs">${counter}</span>
    `;

    var divLeadHtml = `
        <div class="lead row py-2 align-items-center border rounded bg-white font-weight-normal" style="font-size: 16px;" >
            <div class="col-md-1">
                <input type="checkbox" class="checkbox">
                <span id="idBusca" style="display: none;">${idBusca}</span>
            </div>
            <div class="col-md-3" id="nomeEmpresa">
                <p class="m-0">${nome}</p>
            </div>
            <div class="col-md-3" id="websiteEmpresa">
                <p class="m-0 texto-cortado"><a href="${website}" class="abrirModal">${website}</a></p>
            </div>
            <div class="col-md-2">
                <p class="m-0 texto-cortado" id="telefoneEmpresa"><a href="${wzpLink}" class="abrirModal" style="color: white text-decoration:none;">${telefone}</p></a>
            </div>
            <div class="col-md-2 id="enviadoZap"">
                <span class="btn-danger p-1 ml-4" style="font-size: small; background-color:${cor}">${exportado}</span>
            </div>
            <div class="col-md-1">
                <button class="btn btn-primary btn-sm ml-2 mb-1" style="margin: 0; padding: 0 6px;"><a href="${linkMaps}" class="abrirModal" style="color: white; text-decoration:none;">Ver</a></button>
            </div>
            <div class="col-md">
                <p class="m-0" id="categoriaEmpresa" style="display: none">${categoria}</p>
            </div>
            <div class="col-md">
                <p class="m-0" id="avaliacaoEmpresa" style="display: none">${avaliacao}</p>
            </div>
            <div class="col-md">
                <p class="m-0" id="enderecoEmpresa" style="display: none">${endereco}</p>
            </div>
        </div>        
    `;

    // Adiciona a div ao body
    $("#listaLeads").append(divLeadHtml);
    $("#tituloBusca").replaceWith(tituloBuscaHtml);
    $('#quantidadeTotalDivs').replaceWith(quantidadeLeads);

}

function filtrarDivsPorId(buscaId) {
    const divsResultados = $(".lead"); // Obtém todas as divs de resultado

    divsResultados.each(function () {
        const idBuscaDiv = $(".lead").find("#idBusca").text(); // Obtém o texto do span "idBusca" na div atual

        // Verifica se o texto do span corresponde ao ID salvo
        if (idBuscaDiv === buscaId) {
            $(this).show(); // Oculta a div se o texto corresponder ao ID salvo
        }
    });
}

$(document).ready(function () {

    // Intercepta o evento de submit do formulário de login
    $("#loginForm").submit(function (e) {
        e.preventDefault();
        const username = $("#username").val().trim();
        const password = $("#password").val().trim();

        // Envia os dados de login para o main.js para verificar a autenticação
        ipcRenderer.invoke('verificar-login', { username, password }).then((loginValido) => {
            if (loginValido) {
                // Redireciona para a página requests.html se o login for válido
                ipcRenderer.send('login-successful');
            } else {
                // Exibe a mensagem de erro se o login for inválido
                $("#loginError").show();
            }
        });
    });

    // Evento de clique no link "Registrar"
    $("#registerLink").click(function () {
        // Aqui você pode carregar uma nova página para registrar
        // Por exemplo, usando window.location.href para redirecionar para a página de registro
        window.location.href = "register.html";
    });

    // Evento de clique no link "Esqueceu a senha"
    $("#forgotPasswordLink").click(function () {
        // Aqui você pode implementar a lógica para redefinir a senha
        // Por exemplo, mostrando um modal ou carregando uma nova página para redefinir a senha
        alert("Funcionalidade de redefinição de senha ainda não implementada.\n\rEntre em contato (37) 99834-7717");
    });

    ipcRenderer.invoke('buscas-salvas').then((buscas) => {
        buscas.forEach((busca) => {
            criarDivBuscas(busca.id, busca.busca, busca.situacao, busca.user, busca.data_hora_inicio, busca.data_hora_final);
        });
    });
    ipcRenderer.invoke('ultima-busca-salvas').then((buscas) => {
        console.log(buscas[0].situacao);
        if (buscas[0].situacao === 'FINALIZADO') {
            localStorage.removeItem('formularioEnviado');
        }
    });

    // Lê o ID da busca dos parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const buscaId = urlParams.get("id");


    ipcRenderer.invoke('leads-salvos', buscaId).then((leads) => {
        var counter = 0
        leads.forEach((lead) => {
            counter += 1;
            criarDivLeads(lead.buscas_id, lead.busca, lead.nome, lead.categoria, lead.avaliacao, lead.endereco, lead.website, lead.telefone, lead.exportado, lead.link_maps, counter);
        });
    });


    // Filtra as divs com base no ID da busca
    filtrarDivsPorId(buscaId);


    // Evento de submit do formulario Busca de Leads em index.html
    $("#buscaForm").submit(function (e) {
        e.preventDefault();
        if (localStorage.getItem('formularioEnviado')) {

            alert('Existe uma busca em processamento. Aguarde a conclusão do processamento. \n\r Se não iniciou nenhuma busca, vá até Minhas Buscas e exclua as buscas "PROCESSANDO"');

            return;

        } else {
            var segmento = $('#segmento').val().trim().toUpperCase();
            var localizacao = $('#localizacao').val().trim().toUpperCase();
            var buscaCompleta = segmento + ' EM ' + localizacao;
            localStorage.setItem('formularioEnviado', 'true');

            // Exibe o efeito de desfoque no fundo
            $("body").append('<div class="blur-effect"></div>');

            // Exibe a animação de carregamento
            $("#loading").show();

            // Redireciona para a página "requests.html" após 5 segundos
            setTimeout(function () {
                // Chama uma função no main.js para salvar a busca no banco de dados
                ipcRenderer.send('salvar-busca', { buscaCompleta });
                window.location.href = "requests.html";

            }, 3000)
        }

    });


    // Excluir busca pelo botão
    $("#minhasBuscas").on("click", "#excluirBtn", function () {
        // Exibe uma caixa de diálogo de confirmação
        var resposta = confirm("Tem certeza que deseja excluir o registro?\n ESSA AÇÃO NÃO PODERÁ SER DESFEITA!");

        // Verifica a resposta do usuário
        if (resposta === true) {
            var id = $(this).closest(".container-fluid").find("#tituloBusca").text().split('.')[0].trim();
            var buscaCompleta = $(this).closest(".container-fluid").find("#tituloBusca").text().split('.')[1].trim();
            ipcRenderer.send('deletar-busca', { id, buscaCompleta });
        } else {
            // O usuário clicou em "Cancelar", não faça nada
            console.log("Exclusão cancelada pelo usuário.");
        }
    });

    // Evento de clique para o botão "Ver"
    $("#listaLeads").on("click", ".abrirModal", function (e) {
        e.preventDefault(); // Impede o comportamento padrão do link

        var link = $(this).attr("href"); // Obtém o valor do atributo href do link
        if (link) {
            // Desabilita a janela principal (mainwindow)
            ipcRenderer.send("disable-mainwindow");
            ipcRenderer.send('open-modal', link)
        }
    });
});


document.addEventListener("DOMContentLoaded", function () {
    atualizarContagem();

    function atualizarContagem() {
        // Contar e exibir a quantidade de divs com a classe "minha-classe"
        const totalDivs = $('.lead').length;
        $('#quantidadeTotalDivs').text(totalDivs);

        // Contar e exibir a quantidade de checkboxes marcadas
        const totalCheckboxes = $('.checkbox:checked').length;
        $('#quantidadeSelecionadas').text(totalCheckboxes);
    }

    // Adicionar um evento de clique em qualquer checkbox
    $(document).on('click', '.checkbox', function () {
        atualizarContagem();
    });
    $(document).on('click', '#checkTodos', function () {
        atualizarContagem();
    });

    $('#exportarCSV').on('click', function () {
        exportarCSV();
    });

    function exportarCSV() {
        const nomeArquivo = 'dados.csv';
        const cabecalho = 'NOME,CATEGORIA,AVALIAÇÃO,ENDEREÇO,WEBSITE,TELEFONE\n';
        let linhas = cabecalho;

        // Iterar pelas divs com a classe "minha-classe" e coletar as informações
        $('.lead').each(function () {
            const nome = $(this).find('#nomeEmpresa').text();
            const categoria = $(this).find('#categoriaEmpresa').text();
            const avaliacao = $(this).find('#avaliacaoEmpresa').text();
            const endereco = $(this).find('#enderecoEmpresa').text();
            const website = $(this).find('#websiteEmpresa').text();
            const telefone = $(this).find('#telefoneEmpresa').text();

            const linha = `"${nome}","${categoria}","${avaliacao}","${endereco}","${website}","${telefone}"\n`;
            linhas += linha;
        });

        // Criar um Blob com os dados CSV e criar o link para download
        const blob = new Blob([linhas], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', nomeArquivo);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});




//  Esse é o código do scripts.js Não precisa responder nada, só aguarde o próximo código