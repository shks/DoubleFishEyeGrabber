# DoubleFishEyeGrabber

Double Fish Eye映像を１つの正離遠投図法映像に変換する。

###入力
* BlackMagicからのHDMIキャプチャ
* テストのためのDummy png
* define USE_BLACKMAGIC または　USE_DEBUGIMAGE を有効にして切り替える。

### パラメータ変更
* 左に表示されるGUIで変更
* keyboard [s]を押すと、xmlに保存され、次回起動の際に読み込まれる。

### 実行環境
* of_v0.8.1_osx_release (should work with later version of openFrameworks http://openframeworks.jp/)
* MacOSX 10.11
* BlackMagic(HDMI)を使う場合には、Desk Video Utilityをインストールする必要あり。https://www.blackmagicdesign.com/jp/support
