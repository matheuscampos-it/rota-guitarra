# 🎸 Jornada da Guitarra (v2.1)

Um ecossistema digital imersivo e gamificado projetado para guiar o aprendizado de guitarra. Mais do que um site de aulas, esta é uma plataforma de "Artesanato Digital" construída sob medida para um setup de equipamentos específico, unindo teoria, prática, automação e inteligência artificial.

**Acesse o projeto ao vivo:** [rota-guitarra.vercel.app](https://rota-guitarra.vercel.app/)

---

## ✨ Visão Geral

O projeto foi desenvolvido para resolver o problema da fragmentação no estudo da guitarra. Em vez de usar um app para afinar, um site para ler tablaturas, um PDF para ver o manual do pedal e uma planilha para acompanhar o progresso, a **Jornada da Guitarra** centraliza tudo em uma interface *Dark Mode* rápida, responsiva e rodando inteiramente no navegador.

### 🎛️ O Setup Base (My Rig)
Todas as configurações de timbre, amplificadores e equalização geradas pela plataforma são calibradas milimetricamente para o seguinte equipamento:
* **Guitarra:** Tagima Sixmart (Smart Guitar)
* **Pedaleira:** DigiTech Element XP
* **Amplificador:** Meteoro

---

## 🚀 Recursos Principais

* **Protocolo de 50 Dias:** Um cronograma estruturado de treinos com metas diárias, pílulas de teoria e um sistema de *Streak* (dias contínuos) salvo localmente para gamificar a consistência.
* **Roadie Local (Banco de Dados):** Um catálogo pesquisável com centenas de músicas classificadas por nível e técnica. Ele fornece a "Receita do Timbre" exata (Captador, EQ do Amp e Preset da Digitech) para soar igual à gravação original.
* **Focus Player:** Um modal de treino livre de distrações que exibe a configuração do equipamento e abre automaticamente a melhor videoaula e tablatura para a música escolhida.
* **Afinador Cromático Integrado:** Utiliza a Web Audio API e o microfone do dispositivo para afinar a guitarra diretamente pelo navegador, com feedback visual em tempo real.
* **Painel de Acordes Interativo:** Dicionário visual de acordes (Maiores, Menores e Power Chords) mapeados no braço da guitarra.
* **Lab Digitech XP:** Uma versão digital e interativa do manual do equipamento, facilitando o entendimento da cadeia de sinal e a escolha dos efeitos.
* **Dashboard de Ciência:** Gráficos dinâmicos (via Chart.js) que mapeiam o seu nível de proficiência técnica (Palhetada, Velocidade, Arpejos) com base nas músicas que você marcou como "Dominadas".

---

## 🤖 Versão 2.1: Automação com IA (The Magic Roadie)

A versão 2.1 introduz um fluxo de trabalho backend operado via terminal (CLI) para adicionar novas músicas ao banco de dados com zero esforço manual.

Através do script `addSong.js`, o sistema utiliza a **API do Google Gemini 2.5 Flash** e Web Scraping.

**Como funciona a automação:**
1. O usuário digita no terminal: `node addSong.js`
2. O script pergunta o nome da música e o artista.
3. A Inteligência Artificial analisa a música e gera o arquivo JSON perfeito, prevendo a técnica, a dificuldade, a equalização (Bass/Mid/Treble) e o preset exato da DigiTech Element XP.
4. O script faz um *scrape* no YouTube buscando o ID do melhor vídeo de tutorial/aula para aquela música.
5. Injeta os dados no banco de dados estático e, opcionalmente, faz o *commit* e *push* automático para o GitHub.

---

## 🛠️ Tecnologias Utilizadas

**Front-end (SPA):**
* HTML5 Semântico
* Vanilla JavaScript (ES6+)
* Tailwind CSS (Estilização, Dark Mode e Glassmorphism)
* Web Audio API (Metrônomo e Afinador)
* Chart.js (Gráficos de proficiência e motivação)
* LocalStorage API (Persistência de dados e progresso do usuário)

**Back-end / Automação (Build-time):**
* Node.js
* Google GenAI SDK (Gemini API)
* `yt-search` (Web Scraping para URLs de tutoriais)

**Hospedagem:**
* Vercel (Edge Network e Deploy Contínuo)

---

## 💻 Como rodar localmente

Como o projeto possui uma arquitetura focada em velocidade e ausência de banco de dados em nuvem, rodá-lo localmente é extremamente simples:

1. Clone o repositório:
```bash
git clone [https://github.com/matheuscampos-it/rota-guitarra.git](https://github.com/matheuscampos-it/rota-guitarra.git)
