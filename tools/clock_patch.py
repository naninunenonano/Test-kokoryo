"""Checked TEST-only hooks for the current game. Refuse unknown upstream structure."""
from pathlib import Path
import re


def share_normal_conversion(source, once):
    # Reuse the upstream UI handler itself, including its amount, bonuses and logs.
    pattern = r'b.onclick=\(\)=>\{(let used=useDie\(d\.id\);.*?)\};nd.appendChild\(b\)'
    matches = list(re.finditer(pattern, source, re.S))
    if len(matches) != 1:
        raise ValueError('Normal die conversion structure changed; refusing a separate timeout rule')
    match = matches[0]
    body = match[1].replace('useDie(d.id)', 'useDie(dieId)', 1)
    source = once(source, match[0], 'b.onclick=()=>testClockConvertNormalDie(d.id);nd.appendChild(b)')
    return source, 'function testClockConvertNormalDie(dieId){' + body + '}\n'


def inject_clock(source, once):
    hooks = [
        ('function beginTurn(){', 'function beginTurn(){\n testClockBeginTurn();'),
        ('function completeEnd(){', 'function testClockOriginalCompleteEnd(){'),
        ('function resetGameEndState(){', 'function resetGameEndState(){\n testClockReset();'),
        ('function finishGame(){', 'function finishGame(){\n testClockStop();'),
        ('function renderGame(){', 'function renderGame(){testClockRender();'),
        ('const choiceOwner=turn;const canChoose=()=>!(onlineDebugMode||realOnlineMainMode)||viewer===choiceOwner;', 'const choiceOwner=turn,choiceClockToken=testClockState?.token;const canChoose=()=>testClockLeaseValid(choiceOwner,choiceClockToken)&&(!(onlineDebugMode||realOnlineMainMode)||viewer===choiceOwner);'),
        ('function finish(result){overlay.remove();resolve(result)}', 'function finish(result){overlay.remove();resolve(result)}\n  overlay.dataset.testClockPayment="true";overlay.__testClockCancel=()=>finish(null);'),
        ('botBusy=true;const actor=turn;', 'botBusy=true;const actor=turn,clockBotToken=testClockState.token;'),
        ('const botPause=ms=>new Promise(resolve=>setTimeout(resolve,ms));', 'const botPause=ms=>{const owner=turn,token=testClockState.token;return new Promise(resolve=>setTimeout(resolve,ms)).then(()=>{if(!testClockBotValid(owner,token))throw TEST_CLOCK_CANCEL})};'),
        ("}catch(err){console.error('BOT turn failed',err);", "}catch(err){if(err===TEST_CLOCK_CANCEL||!testClockBotValid(actor,clockBotToken))return;console.error('BOT turn failed',err);"),
        ('viewer=0;completeEnd();\n }catch(err)', 'if(!testClockBotValid(actor,clockBotToken))return;viewer=0;completeEnd();\n }catch(err)'),
        ('botTimer=setTimeout(()=>{void botExecuteTurn()},650);', 'const owner=turn,token=testClockState.token;botTimer=setTimeout(()=>{if(testClockBotValid(owner,token))void botExecuteTurn()},650);'),
        ('window.__botParkChoiceQueued=true;\n   setTimeout(()=>{', 'window.__botParkChoiceQueued=true;const clockParkToken=testClockState.token;\n   setTimeout(()=>{'),
        ('window.__botParkChoiceQueued=false;\n    if(!pendingParkPlayers.length', 'window.__botParkChoiceQueued=false;\n    if(clockParkToken!==testClockState.token)return;\n    if(!pendingParkPlayers.length'),
    ]
    for old, new in hooks:
        source = once(source, old, new)
    start = source.index('async function botExecuteTurn(){')
    end = source.index('function queueBotTurn(){', start)
    bot = source[start:end]
    bot, count = re.subn(r'await (botPause\([^)]*\)|botWaitForParkChoice\(actor\));',
                        r'await \1;if(!testClockBotValid(actor,clockBotToken))return;', bot)
    if count < 10:
        raise ValueError('Bot await structure changed; refusing an unguarded clock preview')
    source = source[:start] + bot + source[end:]
    # These are game-owned native dialogues; wrappers decline optional requests during timeout.
    source = re.sub(r'(?<![\w.])prompt\(', 'testClockPrompt(', source)
    source = re.sub(r'(?<![\w.])confirm\(', 'testClockConfirm(', source)
    source, conversion = share_normal_conversion(source, once)
    module = conversion + Path(__file__).with_name('turn_clock.js').read_text()
    return once(source, '\n})();\nconst q=s=>document.querySelector(s);', '\n' + module + '\n})();\nconst q=s=>document.querySelector(s);')
