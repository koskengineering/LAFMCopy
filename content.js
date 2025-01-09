javascript: (function () {
  /* テーブルからデータを取得する関数 */
  function extractTableData() {
    /* 商品IDと商品名のマッピング */
    const productMap = {
      468: "紫ウニ80g",
      985: "紫ウニ80g×3",
      3181: "白ウニ100g",
      3182: "白ウニ100g×3",
      2828: "からすみスライス5枚",
      2829: "からすみスライス5枚×2",
    };
    /* URLから商品IDを抽出する正規表現 */
    const productName = (() => {
      const idMatch = document
        .querySelector(".management_top a")
        .href.match(/\/products\/(\d+)/);
      if (!idMatch) {
        return null;
      }
      const productId = idMatch[1];
      /* 商品IDに対応する商品名を取得 */
      const productName = productMap[productId];
      if (!productName) {
        return null;
      }
      return productName;
    })();

    const store = "ファーマーズマーケット";
    const accountName =
      document.querySelector(".management_aside.farmer .name")?.innerText ||
      null;

    const { postalAndAddress, name, phone } = (() => {
      const addressElement = document.querySelector("address");
      if (!addressElement) {
        return {
          postalAndAddress: null,
          name: null,
          phone: null,
        };
      }

      const addressHTML = addressElement.innerHTML;
      /* HTMLからテキストを抽出し、改行で分割 */
      const lines = addressHTML
        .replace(/<[^>]+>/g, "\n") /* HTMLタグを改行に置換 */
        .split("\n")
        .map((line) => line.trim()) /* 各行の空白を削除 */
        .filter((line) => line); /* 空行を削除 */

      /* 郵便番号と住所を結合 */
      const postalAndAddress = lines
        .filter((line) => line.includes("〒") || line.includes("県"))
        .join(" ");

      if (!postalAndAddress) {
        return {
          postalAndAddress: null,
          name: null,
          phone: null,
        };
      }

      /* 名前を抽出（「様」を除去） */
      const name =
        lines
          .find((line) => line.includes("様"))
          ?.replace("様", "")
          ?.trim() || null;

      /* 電話番号を抽出 */
      const phone =
        lines.find((line) => /^\d+$/.test(line.replace(/-/g, "")))?.trim() ||
        null;

      return {
        postalAndAddress,
        name,
        phone,
      };
    })();
    const orderDate = (() => {
      /* "注文を確定しました"というテキストを含む要素を探す */
      const confirmationElement = Array.from(
        document.querySelectorAll(".balloon .title")
      ).find((el) => el.textContent.includes("注文を確定しました"));

      if (!confirmationElement) {
        return null;
      }

      /* 最も近い.wrapper要素を見つける */
      const wrapper = confirmationElement.closest(".wrapper");
      if (!wrapper) {
        return null;
      }

      /* wrapper内のtime要素を見つける */
      const timeElement = wrapper.querySelector("time");
      if (!timeElement) {
        return null;
      }

      /* datetime属性から日付を抽出 */
      const datetime = timeElement.getAttribute("datetime");
      /* YYYY-MM-DD形式で日付を抽出 */
      const dateMatch = datetime.match(/(\d{4}-\d{2}-\d{2})/);

      return dateMatch ? dateMatch[1].replace(/-/g, "/") : null;
    })();

    const { productPrice, shippingPrice, totalPrice } = (() => {
      /* 価格を抽出して数値に変換する関数 */
      const extractPrice = (text) => {
        const match = text.match(/¥([\d,]+)/);
        if (match) {
          /* カンマを除去して数値に変換 */
          return parseInt(match[1].replace(/,/g, ""), 10);
        }
        return null;
      };

      /* 商品合計を取得 */
      const productTotal = Array.from(
        document.querySelectorAll(".price li")
      ).find((li) => li.textContent.includes("商品合計"));
      const productPrice = productTotal
        ? extractPrice(productTotal.lastElementChild.textContent)
        : null;

      /* 送料合計を取得 */
      const shippingTotal = Array.from(
        document.querySelectorAll(".price li")
      ).find((li) => li.textContent.includes("送料合計"));
      const shippingPrice = shippingTotal
        ? extractPrice(shippingTotal.lastElementChild.textContent)
        : null;

      /* 合計を取得 */
      const total = document.querySelector(".total_num");
      const totalPrice = total
        ? extractPrice(total.lastElementChild.textContent)
        : null;

      /* 結果を指定の形式で返す */
      return { productPrice, shippingPrice, totalPrice };
    })();

    const { courier, trackingNumber } = (() => {
      /* "商品を発送しました"というテキストを含む要素を探す */
      const confirmationElement = Array.from(
        document.querySelectorAll(".balloon .title")
      ).find((el) => el.textContent.includes("商品を発送しました"));

      if (!confirmationElement) {
        return null;
      }

      /* 最も近い.wrapper要素を見つける */
      const wrapper = confirmationElement.closest(".wrapper");
      if (!wrapper) {
        return null;
      }

      /* テキスト要素を見つける */
      const textElement = wrapper.querySelector(".text");
      if (!textElement) {
        return null;
      }

      /* 配送業者名を抽出（ヤマト便から"ヤマト"を抽出） */
      const courierMatch =
        textElement.textContent.match(/(ヤマト|佐川|日本郵便)/);
      const courier = courierMatch ? courierMatch[1] : null;

      /* お問合せ番号を抽出（数字-数字-数字の形式） */
      const trackingMatch =
        textElement.textContent.match(/(\d{4}-\d{4}-\d{4})/);
      const trackingNumber = trackingMatch ? trackingMatch[1] : null;

      return {
        courier,
        trackingNumber,
      };
    })();

    const notesText = (() => {
        /* 特記事項のh2要素を探す */
        const notesSection = Array.from(document.querySelectorAll('.trade_item'))
          .find(item => item.querySelector('h2')?.textContent.includes('特記事項'));
      
        if (!notesSection) {
          return null;
        }
      
        /* その中のtrade_textを取得 */
        const specialNotes = notesSection.querySelector('.trade_text');
        if (!specialNotes) {
          return null;
        }
      
        let notesText = specialNotes.textContent;
      
        /* 削除する文言のリスト */
        const removeTexts = [
          "■水揚げは天候に左右されるため、日時指定は困難です。",
          "■着時間指定は対応可能です。例）午前中、16時以降など",
        ];
      
        /* 指定の文言を削除 */
        removeTexts.forEach((text) => {
          notesText = notesText.replace(text, "");
        });
      
        /* 余分な改行や空白を整理 */
        notesText = notesText.trim();
      
        /* 結果を返す */
        return notesText || null;  /* 空文字列の場合はnullを返す */
      })();

    /* 取得したすべての結果を返す */
    return {
      store,
      accountName,
      postalAndAddress,
      name,
      phone,
      productName,
      orderDate,
      productPrice,
      shippingPrice,
      totalPrice,
      courier,
      trackingNumber,
      notesText,
    };
  }

  /* テーブルからデータを取得してクリップボードにコピーする */
  const data = extractTableData();
  console.log(data);

  /* タブ区切りの文字列を作成 */
  const row = [
    data.store,
    "" /* 注文リンク（空欄） */,
    data.accountName,
    "" /* メールアドレス（空欄） */,
    data.phone,
    data.productName,
    data.orderDate,
    data.productPrice,
    data.shippingPrice,
    data.totalPrice,
    data.courier,
    data.trackingNumber,
    data.name /* 送り先氏名は顧客名と同じ */,
    data.postalAndAddress,
    data.notesText,
  ].join("\t");

  /* 一時的なテキストエリアを作成 */
  const textarea = document.createElement("textarea");
  textarea.value = row;
  document.body.appendChild(textarea);
  textarea.select();

  try {
    /* クリップボードにコピー */
    document.execCommand("copy");
    console.log("データをクリップボードにコピーしました");
    console.log("コピーされたデータ:", data);
  } catch (err) {
    console.error("クリップボードへのコピーに失敗しました:", err);
  } finally {
    /* 一時的なテキストエリアを削除 */
    document.body.removeChild(textarea);
  }
})();
