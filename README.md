**NOTICE: これは不安定なマスターです。http://vvvvjs.com の既存のドキュメントは v1.0 のタグを参照しており、このバージョンとは異なる可能性があります。**
**また、本リポジトリの内容はzauner氏の開発したvvvv.jsの内容を2021年現在のフロントエンド技術に組み込めるように改良中のものであり、動作が不安定であることがあります。**

VVVV.js - Visual Web Client Programming
=======================================

[www.vvvvjs.com](http://www.vvvvjs.com)

**ビジュアルプログラミング言語 VVVV を Web ブラウザで実現します。**

VVVV.jsは、世界で最も優れたビジュアルプログラミング言語 [VVVV](http://vvvv.org)を使って、あなたのウェブプロジェクトを強化することができます。コードを一行も書かずに、2D Canvasや3D WebGLグラフィックスを作成することができます。VVVV.jsには、ブラウザベースのパッチエディタが組み込まれており、追加のソフトウェアは必要ありません。

Main Features
-------------

* Webプロジェクトに埋め込まれたVVVパッチをシームレスに実行可能
* 内蔵されたブラウザベースのパッチエディタでリアルタイムにパッチを適用
* サブパッチをサポートしているので、パッチをより適切に構成することが可能
* シェーダーコードエディタを内蔵した2D Canvasグラフィックスおよび3D WebGLグラフィックス
* VVVV.jsのパッチから周囲のページのDOMにアクセスして操作可能
* VVVVと互換性のあるデータフォーマットにより、パッチのスニペットを従来のVVVVと交換することができます。

Licence
-------

VVVV.js は、MIT ライセンスの下で自由に配布できます (詳細は LICENCE ファイルを参照)。概念（ノード、ピン、スプレッドなど）は、VVVV（http://www.vvvv.org）から引用しています。

このソフトウェアは、jQuery、underscore.js、d3.js、glMatrix.jsを使用しています。詳細は、libフォルダ内の対応するライセンスファイルを参照してください。


Getting Started
---------------

VVVV.js に直接触れるには、 [VVVV.js Lab](http://lab.vvvvjs.com)に行って試してみるのが一番です。ここでは、何もインストールすることなく VVVV.js のパッチを適用することができます。VVVV.jsを自分のプロジェクトで使用する方法をご紹介します。


### Loading VVVV.js and running patches

ただし、ここではインストールの手順を紹介します。

1.  [Node.js 14.x](http://nodejs.org)をダウンロードしてインストールします。本家ではNode.js6系を推奨していますが、本リポジトリの内容はNode.js14系を利用していても動作します。

2. VVVV.js を `/your/project/directory/vvvv_js` にダウンロードまたはクローンします。

3. コンソール/ターミナルで vvvv.js ディレクトリに移動し、`npm i` を実行します。

4. この時点で、VVVV.js のテンプレートを [VVVV.js template](https://github.com/zauner/vvvv.js-template) を`/your/project/directory/vvvvjs-template`にダウンロード/クローンすることができます。このテンプレートを使用することに決めた場合は、7.をスキップできます。

5. プロジェクトのディレクトリに空の VVVV パッチを作成します。そのためには、空の .v4p パッチを作成してください。この例では、`/your/project/directory/main.v4p`です。

6. フロントエンドのHTMLを準備し、VVVV.jsをincludeして読み込むようにします（以下同様）。

/your/project/directory/index.html:

    <head>
    ...
    <script type="text/javascript" src="/vvvvjs/lib/require.js"></script>
    <script type="text/javascript" src="/vvvvjs/vvvv.js"></script>
    <link rel="VVVV" href="main.v4p"/>
    <script type="text/javascript">
      VVVVContext.init("/vvvv_js/", 'full', function() {
        console.log('VVVV.js initialized');
      });
    </script>
    ...
    </head>

このコードは、フロントエンドの VVVV.js を初期化し、`main.v4p`をロードして実行します。

7.  `/your/project/directory` で以下を実行します。

    $ node vvvv_js/server.js . -e

これにより、VVVV.jsのウェブサーバが実行されます。 また、`-e`オプションを付けるとパッチ編集が可能になります。

    http://localhost:5000

これは `index.html`を表示するだけで,`mypatch.v4p` はまだ空なので、それ以上は何も起こりません。パッチエディターを起動するには、次の手順に従ってください。


### Launching the patch editor

1. アドレスバーのURLに`#edit/main.v4p`を追加してエディタを起動します。これによりエディタがポップアップで起動しますので、ブラウザが許可していることを確認してください。

2. 保存するには、エディタ上でCTRL+Sを押してください。

### Manually loading patches

上記の<link>タグを使った方法がニーズに合わない場合（パッチをすぐに実行したくない場合など）は、以下のようにVVVV.Core.Patchオブジェクトを自分で作成することができます。

    <head>
    ...
    <script type="text/javascript" src="/vvvv_js/lib/require.js"></script>
    <script type="text/javascript" src="/vvvv_js/vvvv.js"></script>
    <script type="text/javascript">
      VVVVContext.init("javascripts/vvvv_js/", 'full', function(VVVV) {
        console.log('VVVV.js initialized');

        var patch = new VVVV.Core.Patch("mypatch.v4p", function() {
          var mainloop = new VVVV.MainLoop(p);
          console.log('patch loaded and started');
        });
      });
    </script>
    ...
    </head>

### Rendering Patches with the VVVViewer

Webサイトに埋め込まれたパッチをロードしてレンダリングするには、まず上記のようにPatchオブジェクトを作成し、それを新しく作成したVVVViewerオブジェクトに渡します。

    var myvvvviewer;
    var mypatch = new VVVV.Core.Patch("mypatch.v4p", function() {
      myvvvviewer = new VVVV.VVVViewer(this, '#patch');
    });

これが対応するHTMLコードです。

    <div id='patch'>Your browser does not support the VVVViewer</div>

上記の例では、パッチのコンストラクタ`new VVVV.Core.Patch("mypatch.v4p", ...)`が、リモートサーバからVVVVパッチファイルをロードしていますが、ファイル名ではなく、実際のVVV XML Codeをコンストラクタに渡すことも可能です。これは、フォーラムの投稿やブログのエントリに含まれる VVVV コードを表示する場合などに適しています。

### More Information

[www.vvvvjs.com](http://www.vvvvjs.com)に関する詳しい情報やガイドをご覧ください。
