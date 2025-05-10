// scraper.js
const puppeteer = require('puppeteer');

async function runScraper(buscaCompleta) {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://www.google.com/maps/search/' + buscaCompleta);

    // Função de scroll para rolar a página até o final da div com role="feed"
    async function scrollToBottom() {
      return await page.evaluate(async () => {
        await new Promise((resolve) => {
          const targetElement = document.querySelector('[role="feed"]');
          const distance = 100; // Distância de rolagem a ser realizada
          const delay = 100; // Tempo de espera após cada rolagem
          const scrollInterval = setInterval(() => {
            const scrollHeightBeforeScroll = targetElement.scrollHeight;
            targetElement.scrollBy(0, distance);
            const scrollHeightAfterScroll = targetElement.scrollHeight;

            // Verifica se chegou ao final da lista
            if (scrollHeightAfterScroll === scrollHeightBeforeScroll) {
              const endMessage = 'Você chegou ao final da lista.';
              if (targetElement.innerText.includes(endMessage)) {
                clearInterval(scrollInterval);
                resolve();
              }
            }
          }, delay);
        });
      });
    }

    // Aguardar até 60 segundos para encontrar a endMessage
    const maxWaitTime = 120000; // 60 segundos
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Tentar fazer o scroll
        await scrollToBottom();
        break; // Se o scroll for bem-sucedido, sair do loop
      } catch (error) {
        // Se ocorrer um erro (não encontrou a endMessage), recarregar a página
        await page.reload();
      }
    }

    // Extrair os links da classe "hfpxzc"
    const linksArray = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.hfpxzc'));
      return links.map(link => link.href);
    });

    // Iterar sobre os links e extrair informações de cada página
    const resultsArray = [];
    for (const link of linksArray) {
      const newPage = await browser.newPage();
      await newPage.goto(link);

      const data = await newPage.evaluate(() => {
        const getText = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.innerText : "";
        };
        const getHref = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.href : "";
        };

        return {
          nome: getText('.DUwDvf'),
          categoria: getText('.DkEaL'),
          avaliacao: getText('.F7nice span span'),
          endereco: getText('[data-item-id="address"]'),
          website: getHref('[data-item-id="authority"]'),
          telefone: getText('[data-item-id^="phone"]'),
          link: location.href
        };
      });

      resultsArray.push(data);
      await newPage.close();
    }

    console.log(resultsArray); // Array contendo os dados de cada link


    await browser.close();
    return resultsArray;
    // Retornar os dados extraídos
  } catch (err) {
    console.error('Erro ao executar o scraping:', err);
    return null;
  }
}

module.exports = runScraper;