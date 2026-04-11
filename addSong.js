const fs = require('fs');
const ytSearch = require('yt-search');
const { GoogleGenAI } = require('@google/genai');
const readline = require('readline/promises');
const { execSync } = require('child_process');

// ⚠️ COLE SUA CHAVE DE API AQUI
const GEMINI_API_KEY = 'AIzaSyAOOCbzkECqUPnQrNqodyNdns7Z70-8imw'; 
const DB_PATH = './data/roadieDb.json';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Cria a interface para ler o que você digita no terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function addMagicSong() {
    console.log("\n=========================================");
    console.log("  🎸 BEM-VINDO AO ROADIE VIRTUAL 🎸");
    console.log("=========================================\n");

    // 1. O SCRIPT FAZ AS PERGUNTAS INTERATIVAMENTE
    const songName = await rl.question("🎵 Qual o nome da música? \n> ");
    const artistName = await rl.question("🎤 Qual o artista ou banda? \n> ");

    if (!songName || !artistName) {
        console.log("\n❌ Erro: Operação cancelada. Música e artista são obrigatórios.");
        rl.close();
        return;
    }

    console.log(`\n🧠 Solicitando à IA a análise do timbre de: ${songName} - ${artistName}...`);

    const prompt = `
    Você é um especialista em timbres de guitarra. Eu preciso dos dados da música "${songName}" do artista "${artistName}".
    Retorne APENAS um objeto JSON válido (sem marcação markdown como \`\`\`json), estritamente com esta estrutura:
    {
      "title": "${songName}",
      "artist": "${artistName}",
      "level": <numero de 1 a 5 baseado na dificuldade>,
      "tech": "<Breve descrição da técnica principal (ex: Ritmo funk, Palhetada alternada)>",
      "equip": "<Configuração sugerida usando Tagima Sixmart, Amp Meteoro e o Preset ideal da pedaleira Digitech Element XP (ex: F15, F41)>",
      "dynamic": "<Nível de agressividade da mão direita (ex: Suave, Agressiva, Crescente)>",
      "eq_meteoro": { "bass": <0-10>, "mid": <0-10>, "treble": <0-10> }
    }
    `;

    try {
        // 2. BUSCA O TIMBRE NO GEMINI
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const newSong = JSON.parse(cleanJson);
        console.log(`   ✅ Timbre gerado! Preset: ${newSong.equip}`);

        // 3. BUSCA O TUTORIAL NO YOUTUBE
        console.log(`\n📺 Buscando a melhor videoaula no YouTube...`);
        const query = `${newSong.artist} ${newSong.title} guitar lesson tutorial`;
        const videoResult = await ytSearch(query);
        
        if (videoResult.videos && videoResult.videos.length > 0) {
            newSong.yt_id = videoResult.videos[0].videoId;
            console.log(`   ✅ Aula encontrada! ID: ${newSong.yt_id}`);
        } else {
            console.log(`   ⚠️ Nenhuma aula encontrada.`);
        }

        // 4. SALVA NO JSON
        const rawData = fs.readFileSync(DB_PATH, 'utf-8');
        let roadieDb = JSON.parse(rawData);
        roadieDb.push(newSong);
        fs.writeFileSync(DB_PATH, JSON.stringify(roadieDb, null, 2));
        
        console.log(`\n💾 Sucesso! "${newSong.title}" foi injetada no banco de dados local.`);

        // 5. AUTOMAÇÃO DO GIT (Opcional)
        console.log("\n-----------------------------------------");
        const pushAnswer = await rl.question("🚀 Deseja fazer o deploy para a Vercel agora? (S/N) \n> ");
        
        if (pushAnswer.toLowerCase() === 's') {
            console.log("\n📦 Empacotando e enviando para o GitHub...");
            // Executa os comandos do Git diretamente pelo JavaScript!
            execSync(`git add . && git commit -m "feat: Adiciona música ${newSong.title}" && git push`, { stdio: 'inherit' });
            console.log("\n🎉 Deploy Concluído! O seu site já está atualizando na Vercel.");
        } else {
            console.log("\n👍 Deploy cancelado. A música está salva apenas no seu computador.");
        }

    } catch (error) {
        console.error("\n❌ Ocorreu um erro durante o processo:", error.message);
    } finally {
        rl.close(); // Encerra a interface do terminal
    }
}

addMagicSong();