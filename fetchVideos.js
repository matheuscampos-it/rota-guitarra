const fs = require('fs');
const ytSearch = require('yt-search');

// O caminho para o teu ficheiro JSON
const DB_PATH = './data/roadieDb.json'; 

async function updateYouTubeIDs() {
    console.log("🎸 A afinar as cordas e a iniciar o Robô de Scraping...\n");

    let rawData;
    try {
        rawData = fs.readFileSync(DB_PATH, 'utf-8');
    } catch (err) {
        console.error("❌ Erro: Não encontrei o roadieDb.json. Verifica se a pasta se chama 'data'.");
        return;
    }

    let roadieDb = JSON.parse(rawData);
    let updatedCount = 0;

    for (let i = 0; i < roadieDb.length; i++) {
        let song = roadieDb[i];

        // Só procura se a música AINDA NÃO tiver o campo yt_id
        if (!song.yt_id) {
            console.log(`A procurar: ${song.artist} - ${song.title}...`);
            
            // Termo de pesquisa super focado para garantir que vem um cover/aula
            const query = `${song.artist} ${song.title} guitar cover`;

            try {
                // A biblioteca faz a pesquisa no YouTube por trás dos panos
                const r = await ytSearch(query);
                
                // Se encontrar vídeos
                if (r.videos && r.videos.length > 0) {
                    // Pega no ID do primeiro vídeo da lista de resultados
                    song.yt_id = r.videos[0].videoId;
                    updatedCount++;
                    console.log(`   ✅ Encontrado! ID: ${song.yt_id}`);
                } else {
                    console.log(`   ⚠️ Nenhum vídeo encontrado.`);
                }

                // Pausa crucial de 1.5 segundos entre cada pesquisa
                // Isto evita que o YouTube bloqueie o nosso "robô"
                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (error) {
                console.error(`\n❌ Falha na busca:`, error.message);
            }
        }
    }

    // Guarda as alterações de volta no teu ficheiro JSON
    if (updatedCount > 0) {
        // O "null, 2" garante que o teu JSON continua bonito e fácil de ler
        fs.writeFileSync(DB_PATH, JSON.stringify(roadieDb, null, 2));
        console.log(`\n💾 Arquivo salvo! ${updatedCount} novas músicas foram atualizadas no roadieDb.json.`);
    } else {
        console.log("\n✨ O teu banco de dados já está a 100%. Nenhuma música nova para procurar.");
    }
}

updateYouTubeIDs();