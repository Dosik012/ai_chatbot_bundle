from flask import Flask
import os

app = Flask(__name__)

@app.route('/trigger', methods=['POST'])
def trigger_signal():
    print("🚨 [TRIGGER] Сигнал қабылданды!")
    os.system('start /min mplay32 /play /close "sound.wav"')
    return 'OK', 200

if __name__ == '__main__':
    app.run(port=5000)
