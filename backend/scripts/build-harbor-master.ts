import * as fs from 'fs';
import * as path from 'path';

type TideApiResponse = {
  status: number;
  message?: string;
  tide?: {
    port?: {
      prefecture_code: string;
      harbor_code: string;
      harbor_namej: string;
      latitude: string;
      longitude: string;
    };
  };
};

type HarborMaster = {
  prefectureCode: string;
  harborCode: string;
  harborName: string;
  latitude: number;
  longitude: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchHarbor(pc: number, hc: number): Promise<HarborMaster | null> {
  const today = new Date();
  const url = `https://api.tide736.net/get_tide.php?pc=${pc}&hc=${hc}&yr=${today.getFullYear()}&mn=${today.getMonth() + 1}&dy=${today.getDate()}&rg=day`;

  const response = await fetch(url);
  const data = (await response.json()) as TideApiResponse;

  if (data.status !== 1 || !data.tide?.port) return null;

  const port = data.tide.port;
  return {
    prefectureCode: port.prefecture_code,
    harborCode: port.harbor_code,
    harborName: port.harbor_namej,
    latitude: parseFloat(port.latitude),
    longitude: parseFloat(port.longitude),
  };
}

async function main() {
  const harbors: HarborMaster[] = [];

  // 🌟 都道府県コードは1〜47、港コードは各都道府県ごとに1から始まる想定で
  //    存在しなくなった時点（連続5回失敗）で次の都道府県に進む
  for (let pc = 1; pc <= 47; pc++) {
    let missCount = 0;

    for (let hc = 1; hc <= 60; hc++) {
      try {
        const harbor = await fetchHarbor(pc, hc);

        if (harbor) {
          harbors.push(harbor);
          missCount = 0;
          console.log(`✅ pc=${pc} hc=${hc}: ${harbor.harborName}`);
        } else {
          missCount++;
          if (missCount >= 5) break; // この都道府県はここまで
        }
      } catch (error) {
        console.error(`❌ pc=${pc} hc=${hc} でエラー`, error);
        missCount++;
        if (missCount >= 5) break;
      }

      await sleep(1500); // 🌟 サイトへの負荷を抑えるため1.5秒間隔
    }
  }

  const outputPath = path.join(__dirname, 'harbors.json');
  fs.writeFileSync(outputPath, JSON.stringify(harbors, null, 2));
  console.log(`\n完了: ${harbors.length}件の港データを ${outputPath} に保存しました`);
}

main();
