const fs = require('fs');
const ytSearch = require('yt-search');

const DB_PATH = './data/roadieDb.json'; 

// ⚠️ MÁGICA AQUI: Mude para 'true' para obrigar o robô a apagar os covers antigos e buscar aulas novas.
// Quando terminar e quiser adicionar músicas no futuro, mude de volta para 'false'.
const FORCE_OVERWRITE = true; 

async function updateYouTubeIDs() {
    console.log("🎸 A iniciar o Robô de Scraping (Foco em Aulas e Tutoriais)...\n");

    let rawData;
    try {
        rawData = fs.readFileSync(DB_PATH, 'utf-8');
    } catch (err) {
        console.error("❌ Erro: Não encontrei o roadieDb.json.");
        return;
    }

    let roadieDb = JSON.parse(rawData);
    let updatedCount = 0;

    for (let i = 0; i < roadieDb.length; i++) {
        let song = roadieDb[i];

        // Só procura se não tiver o ID, OU se estivermos forçando a reescrita (FORCE_OVERWRITE = true)
        if (!song.yt_id || FORCE_OVERWRITE) {
            console.log(`A procurar aula de: ${song.artist} - ${song.title}...`);
            
            // A NOVA PALAVRA-CHAVE: Focada em ensino. 
            // Dica: Se preferir apenas professores brasileiros, mude para "como tocar guitarra aula"
            const query = `${song.artist} ${song.title} guitar lesson tutorial`;

            try {
                const r = await ytSearch(query);
                
                if (r.videos && r.videos.length > 0) {
                    // Pega o primeiro resultado (o YouTube prioriza os melhores tutoriais no topo)
                    song.yt_id = r.videos[0].videoId;
                    updatedCount++;
                    console.log(`   ✅ Aula encontrada! ID: ${song.yt_id}`);
                } else {
                    console.log(`   ⚠️ Nenhum tutorial encontrado.`);
                }

                // Pausa crucial de 1.5s para não ser bloqueado
                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (error) {
                console.error(`\n❌ Falha na busca:`, error.message);
            }
        }
    }

    if (updatedCount > 0) {
        fs.writeFileSync(DB_PATH, JSON.stringify(roadieDb, null, 2));
        console.log(`\n💾 Arquivo salvo! ${updatedCount} aulas fantásticas foram injetadas no seu JSON.`);
    } else {
        console.log("\n✨ Nenhuma alteração foi necessária.");
    }
}

updateYouTubeIDs();