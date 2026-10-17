// Editing source only. Build with npm run build; do not load this file directly.
// Section order and the shared private scope are preserved by src/order.json.

// @kokoryo-section S0007

function contentImagePath(x){let id=contentBaseId(x),m=id.match(/^(CSSR|CSR|CUR|CLR|CN|CR|LL|LU|S|N|P)\d+$/);return m?(CONTENT_IMAGE_DIRS[m[1]]||'')+id+'.png':''}
function resolvedContentImage(x){return (x&&x.image)||contentImagePath(x)}
// @kokoryo-end-section S0007

// @kokoryo-section S0009

function renderLordPortrait(el,charId,label='キャラクターイラスト'){if(!el)return;let src=lordPortraitPath(charId);el.innerHTML='';if(!src){el.textContent='NO IMAGE';return}let img=document.createElement('img');img.src=src;img.alt=(CHARACTER_DATA[charId]?.name||label);img.onerror=()=>{el.textContent='NO IMAGE'};el.appendChild(img)}
// @kokoryo-end-section S0009

// @kokoryo-section S0011

function makeSetupChoiceButton(label,selected,disabled,onpick){
 let b=document.createElement('button');b.type='button';b.className='setup-choice-btn'+(selected?' selected':'');b.textContent=label;b.disabled=!!disabled;b.onclick=onpick;return b
}
function renderPlayerCountChoices(){
 let box=q('#playerCountChoices');if(!box)return;let cur=+q('#playerCount').value;box.innerHTML='';
 for(let n=2;n<=6;n++)box.appendChild(makeSetupChoiceButton(n+'人',n===cur,false,()=>{q('#playerCount').value=n;renderPlayerCountChoices();renderCharacterSelects()}))
}
function renderCharacterSelects(){
 let n=+q('#playerCount').value,box=q('#characterSelects'),prev=[...box.querySelectorAll('.char-row')].map(r=>({family:r.dataset.family,version:r.dataset.version,gender:r.dataset.gender}));box.innerHTML='';
 for(let p=0;p<n;p++){
  let state=prev[p]||{},fallback=CHARACTER_FAMILIES[p%CHARACTER_FAMILIES.length]||CHARACTER_FAMILIES[0];
  let fam=CHARACTER_FAMILIES.find(x=>x.id===state.family)||fallback,ver=characterVersion(fam,state.version),gender=state.gender||'male';
  let row=document.createElement('div');row.className='char-row';row.dataset.player=p;row.dataset.family=fam.id;row.dataset.version=ver.id;row.dataset.gender=gender;
  let head=document.createElement('strong');head.textContent='P'+(p+1);row.appendChild(head);box.appendChild(row);renderCharacterRow(row)
 }
 updateCharacterSelectAvailability()
}
function renderCharacterRow(row){
 let fam=characterFamily(row.dataset.family),ver=characterVersion(fam,row.dataset.version);if(!fam.versions.some(v=>v.id===row.dataset.version))row.dataset.version=fam.versions[0].id;
 ver=characterVersion(fam,row.dataset.version);let sex=row.dataset.gender||'male';if(!ver[sex])sex=ver.male?'male':'female';row.dataset.gender=sex;
 [...row.querySelectorAll('.char-step')].forEach(x=>x.remove());
 let chosen=[...document.querySelectorAll('#characterSelects .char-row')].filter(r=>r!==row).map(r=>r.dataset.family);
 let nameStep=document.createElement('div');nameStep.className='char-step';nameStep.innerHTML='<div class="char-step-label">キャラ名</div>';let names=document.createElement('div');names.className='setup-choice-row';
 availableCharacterFamilies().forEach(g=>names.appendChild(makeSetupChoiceButton(g.label,g.id===fam.id,chosen.includes(g.id),()=>{row.dataset.family=g.id;row.dataset.version=g.versions[0].id;renderCharacterRow(row);updateCharacterSelectAvailability()})));nameStep.appendChild(names);row.appendChild(nameStep);
 let versionStep=document.createElement('div');versionStep.className='char-step';versionStep.innerHTML='<div class="char-step-label">バージョン</div>';let versions=document.createElement('div');versions.className='setup-choice-row';
 fam.versions.forEach(v=>versions.appendChild(makeSetupChoiceButton(v.label,v.id===row.dataset.version,false,()=>{row.dataset.version=v.id;let nv=characterVersion(fam,v.id);if(!nv[row.dataset.gender])row.dataset.gender=nv.male?'male':'female';renderCharacterRow(row)})));versionStep.appendChild(versions);row.appendChild(versionStep);
 ver=characterVersion(fam,row.dataset.version);let genderStep=document.createElement('div');genderStep.className='char-step';genderStep.innerHTML='<div class="char-step-label">性別</div>';let genders=document.createElement('div');genders.className='setup-choice-row';
 [['male','男性'],['female','女性']].forEach(([key,label])=>{if(ver[key])genders.appendChild(makeSetupChoiceButton(label,key===row.dataset.gender,false,()=>{row.dataset.gender=key;renderCharacterRow(row)}))});genderStep.appendChild(genders);row.appendChild(genderStep)
}
// @kokoryo-end-section S0011

// @kokoryo-section S0013

function updateCharacterSelectAvailability(){
 [...document.querySelectorAll('#characterSelects .char-row')].forEach(renderCharacterRow)
}
// @kokoryo-end-section S0013

// @kokoryo-section S0019

function renderUndoActions(){let box=q('#undoactions');if(!box)return;box.innerHTML='';if(botMatchMode||((onlineDebugMode||realOnlineMainMode)&&viewer!==turn)){box.classList.add('hidden');return}box.classList.remove('hidden');let any=false;let ch=commandUndoHistory.filter(commandUndoAvailable);ch.forEach(e=>{any=true;let b=document.createElement('button');b.className='secondary';b.style.margin='4px';if(e.kind==='dieConvert')b.textContent='↩ 🎲'+e.dieValue+'→'+cname(e.color);else if(e.kind==='breadConvert')b.textContent='↩ '+breadLabel(e.order)+'→'+cname(e.color);else b.textContent='↩ '+cname(e.from)+(e.amount||3)+'→'+cname(e.to)+(e.gain??1);b.onclick=()=>undoCommandAction(e.id);box.appendChild(b)});marketUndoHistory.filter(marketUndoEntryAvailable).forEach(e=>{any=true;let b=document.createElement('button');b.className='secondary';b.style.margin='4px';b.textContent='↩ 市場：'+e.cards[0].name+(e.cards.length>1?' ×'+e.cards.length:'');b.onclick=()=>undoMarketAcquisition(e.id);box.appendChild(b)});if(!any)box.innerHTML='<span class="small">現在戻せる操作はありません。</span>'}
// @kokoryo-end-section S0019

// @kokoryo-section S0027

let renderingInstallCosts=false;
// @kokoryo-end-section S0027

// @kokoryo-section S0030

function makeChoicePicker(opts){let box=document.createElement('div');box.className='cost-picker';box.options=opts;box.value=opts.length?String(opts[0].id):'';function paint(){[...box.querySelectorAll('.cost-choice')].forEach(b=>b.classList.toggle('selected',String(b.dataset.value)===String(box.value)))}opts.forEach(x=>{let b=document.createElement('button');b.type='button';b.className='cost-choice';b.dataset.value=x.id;b.textContent=x.label;b.onclick=()=>{box.value=String(x.id);paint()};box.appendChild(b)});paint();return box}
function costSelect(required=null,allowDiscount=true){return makeChoicePicker(allowDiscount&&renderingInstallCosts?costOptions(required):installCostOptions(required,allowDiscount))}
// @kokoryo-end-section S0030

// @kokoryo-section S0033


function card(c,count=1,click=false){let e=document.createElement(click?'button':'div');if(click)e.type='button';let imgSrc=resolvedContentImage(c);e.className='card'+(imgSrc?' hasimg':'');let typeLabel=c.type==='S'?'STANDARD':c.type==='LEGEND'?'LEGEND':'NORMAL';e.innerHTML=(imgSrc?'<img class="cardimg zoomable" src="'+imgSrc+'" alt="'+c.name+'"><div class="cardmeta"><strong>'+c.name+'</strong><span class="small">'+typeLabel+'</span></div>':'<span class="small">'+typeLabel+'</span><strong>'+c.name+'</strong>')+(count>1?'<span class="badge">×'+count+'</span>':'');if(imgSrc){let img=e.querySelector('img');img.onerror=()=>{let ph=document.createElement('div');ph.className='cardimg cardimg-missing';ph.textContent='NO IMAGE';img.replaceWith(ph)}}return e}
// @kokoryo-end-section S0033

// @kokoryo-section S0037

function fillRCSelect(sel){let el=q(sel);if(!el)return;let cards=Object.values(KOKORYO_RULE_PACKS).flatMap(p=>p.ruleCards||[]);el.innerHTML='';cards.forEach(rc=>{let o=document.createElement('option');o.value=rc.id;o.textContent=rc.id+'《'+rc.name+'》';el.appendChild(o)});el.value=gameSettings.ruleCardChoice||cards[0]?.id||''}
function refreshActiveRulesButton(){let b=q('#showActiveRules');if(b)b.classList.toggle('hidden',activeRuleCards().length===0)}
function showActiveRules(){let list=q('#activeRulesList');if(!list)return;let cards=activeRuleCards();list.innerHTML='';if(!cards.length){let e=document.createElement('div');e.className='notice';e.textContent='現在適用中の追加ルールはありません。';list.appendChild(e)}else cards.forEach(rc=>{let e=document.createElement('div');e.className='notice';e.style.marginBottom='10px';e.innerHTML='<strong>'+escapeHtml(rc.id)+'《'+escapeHtml(rc.name)+'》</strong><div class="small" style="margin-top:6px;line-height:1.5">'+escapeHtml(rc.effectText||'説明はありません。')+'</div>';list.appendChild(e)});q('#activeRulesModal').classList.remove('hidden')}
// @kokoryo-end-section S0037

// @kokoryo-section S0040

function renderDraft(){q('#round').textContent=round+1;q('#who').textContent='プレイヤー'+(viewer+1);q('#progress').textContent=selected.filter(Boolean).length+'/'+playerCount+'人選択済み';q('#draftOwnedSummary').textContent='所持 '+hands[viewer].length+'枚';q('#instruction').textContent='プレイヤー'+(viewer+1)+'：欲しいカードそのものをタップして選択';let e=q('#cards');e.innerHTML='';if(!selected[viewer])packs[viewer].forEach((c,i)=>{let w=document.createElement('div');w.className='draft-card-wrap';let b=card(c,1,true);let ef=document.createElement('div');ef.className='card-effect-inline';ef.replaceChildren(cardInfoSections(c));b.appendChild(ef);b.onclick=()=>pick(i);w.appendChild(b);e.appendChild(w)});else{let done=document.createElement('div');done.className='notice';done.style.gridColumn='1/-1';done.textContent='この巡のカードは選択済みです。次のプレイヤーを選択してください。';e.appendChild(done)}let ps=q('#players');ps.innerHTML='';hands.forEach((h,p)=>{let b=document.createElement('button');b.type='button';b.className='player '+(p===viewer?'active':'');b.innerHTML='<strong>P'+(p+1)+'</strong><div class="muted">獲得 '+h.length+'/'+INITIAL_DRAFT.picks+'</div><div class="small">'+(selected[p]?'選択済み':'未選択')+'</div>';b.onclick=()=>{viewer=p;renderDraft()};ps.appendChild(b)})}
function showDraftOwnedCards(){let m=q('#draftOwnedModal'),e=q('#draftOwnedList');q('#draftOwnedTitle').textContent='P'+(viewer+1)+'の獲得済みカード';e.innerHTML='';if(!hands[viewer].length){let x=document.createElement('div');x.className='notice';x.style.gridColumn='1/-1';x.textContent='まだカードを獲得していません。';e.appendChild(x)}else hands[viewer].forEach(c=>{let w=document.createElement('div');w.appendChild(card(c,1,false));let ef=document.createElement('div');ef.className='card-effect-inline';ef.textContent=effectText(c);w.appendChild(ef);e.appendChild(w)});m.classList.remove('hidden')}
function showCharacterAbility(){let lord=CHARACTER_DATA[charOf(turn)];if(!lord)return;q('#abilityModalTitle').innerHTML='《'+escapeHtml(lord.uniqueAbility||'')+'》'+abilityStackTag(lord.uniqueAbility);q('#abilityModalCharacter').textContent=(lord.title?lord.title+' ':'')+lord.name;q('#abilityModalText').textContent=characterAbilityText(lord)||'能力説明はありません。';q('#abilityModal').classList.remove('hidden')}
// @kokoryo-end-section S0040

// @kokoryo-section S0043

function syncMarketTargetUI(){let e=q('#marketTarget');if(e)e.textContent=String(ruleSettingValue('marketTypes',gameSettings.marketTypes))}
// @kokoryo-end-section S0043

// @kokoryo-section S0046

function renderLegends(){
 const box=q('#legendArea');if(!box)return;box.innerHTML='';
 const count=Math.max(0,...legends.map(x=>x.col))+1;
 for(let col=0;col<count;col++){
  const column=document.createElement('div');column.className='card legend-compact-column';
  for(const tier of ['upper','lower']){
   const L=legends.find(x=>x.col===col&&x.tier===tier);
   const item=document.createElement('div');item.className='legend-compact-item';
   if(!L){item.textContent='—';item.classList.add('muted');column.appendChild(item);continue}
   if(L.eraBlocked){item.textContent='除外';item.classList.add('muted');column.appendChild(item);continue}
   const show=()=>openCardImage({src:resolvedContentImage(L)||L.image||'',alt:L.name},L,'legend');
   const detail=document.createElement('div');detail.className='legend-compact-detail';detail.tabIndex=0;detail.setAttribute('role','button');detail.setAttribute('aria-label',L.name+'のカード詳細を表示');
   detail.onclick=show;detail.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show()}};
   if(L.image||L.id){const img=document.createElement('img');img.src=L.image||('images/legends/'+L.id+'.png');img.alt='';img.className='cardimg';img.onerror=()=>img.remove();detail.appendChild(img)}
   const name=document.createElement('strong');name.textContent=L.name;detail.appendChild(name);
   const status=document.createElement('div');status.className='small';status.textContent=(L.taken?'獲得済み ／ ':'')+L.vp+'VP'+(L.eraBlocked?' ／ 選択不可':tier==='upper'&&!L.unlocked?' ／ 未解放':'');detail.appendChild(status);
   const hint=document.createElement('div');hint.className='small muted';hint.textContent='タッチで効果確認';detail.appendChild(hint);item.appendChild(detail);
   if(!L.taken){const locked=(tier==='upper'&&!L.unlocked)||!!L.eraBlocked;const button=document.createElement('button');button.className='secondary';button.textContent=L.eraBlocked?'選択不可':locked?'未解放':'獲得';button.disabled=locked||legendTakenThisTurn||((onlineDebugMode||realOnlineMainMode)&&viewer!==turn);button.onclick=()=>takeLegend(L.id);item.appendChild(button)}
   column.appendChild(item);
  }
  box.appendChild(column);
 }
}
// @kokoryo-end-section S0046

// @kokoryo-section S0048

function renderInitialPowerSetup(){let box=q('#initialPowerSetup');box.innerHTML='';if(initialPowerChoices.length!==playerCount){initialPowerChoices=Array.from({length:playerCount},()=>({y:0,r:0,p:0}));initialPowerPlayer=0}let p=Math.max(0,Math.min(initialPowerPlayer,playerCount-1)),row=document.createElement('div'),v=initialPowerChoices[p],total=v.y+v.r+v.p,remain=gameSettings.initialResources-total;row.className='actionblock';row.innerHTML='<div class="row"><div><strong>P'+(p+1)+'（'+CHARACTER_DATA[charOf(p)].name+'・'+CHARACTER_DATA[charOf(p)].gender+'）</strong><div class="small">P'+(p+1)+'の初期資源を選択中　残り <strong>'+remain+'</strong> 個</div></div><span class="small">'+(p+1)+' / '+playerCount+'</span></div>';let handTitle=document.createElement('div');handTitle.style.marginTop='12px';handTitle.innerHTML='<strong>現在の手札</strong><div class="small">手札を確認してから資源配分を決められます。</div>';row.appendChild(handTitle);let hg=document.createElement('div');hg.className='board-hand-grid';hg.style.marginTop='7px';if(!hands[p].length){let e=document.createElement('div');e.className='muted';e.textContent='手札はありません。';hg.appendChild(e)}else hands[p].forEach(c=>{let w=document.createElement('div');w.className='board-hand-card';w.appendChild(card(c,1,false));let ef=document.createElement('div');ef.className='small';ef.style.marginTop='4px';ef.textContent=effectText(c);w.appendChild(ef);hg.appendChild(w)});row.appendChild(hg);let picks=document.createElement('div');picks.className='turnstart-buttons';picks.style.marginTop='12px';[['y','💰 資金'],['p','🍖 食料'],['r','⚔️ 兵力']].forEach(([color,label])=>{let btn=document.createElement('button');btn.type='button';btn.className='secondary';btn.textContent=label+' '+v[color];btn.disabled=remain<=0;btn.onclick=()=>{if(v.y+v.r+v.p<gameSettings.initialResources){v[color]++;renderInitialPowerSetup()}};picks.appendChild(btn)});let reset=document.createElement('button');reset.type='button';reset.className='secondary';reset.textContent='選び直す';reset.disabled=total<=0;reset.onclick=()=>{initialPowerChoices[p]={y:0,r:0,p:0};renderInitialPowerSetup()};picks.appendChild(reset);row.appendChild(picks);let nav=document.createElement('div');nav.className='row';nav.style.marginTop='14px';let back=document.createElement('button');back.className='secondary';back.textContent='前のプレイヤー';back.disabled=p===0;back.onclick=()=>{initialPowerPlayer--;renderInitialPowerSetup()};let next=document.createElement('button');next.className='primary';next.textContent=p===playerCount-1?'初期資源を確定してゲーム開始':'P'+(p+2)+'へ';next.disabled=total!==gameSettings.initialResources;next.onclick=()=>{if(total!==gameSettings.initialResources)return;if(p===playerCount-1)confirmInitialPowers();else{initialPowerPlayer++;renderInitialPowerSetup()}};nav.append(back,next);row.appendChild(nav);box.appendChild(row)}
// @kokoryo-end-section S0048

// @kokoryo-section S0057

function renderPackCharacterConversionActions(){
 let nd=q('#normalconvertchoices'),amount=3+conversionBonus();if(!nd||!hasGodBlessingForTurn()||!unusedDice().length)return;
 let sep=document.createElement('div');sep.className='small';sep.style.marginTop='8px';sep.textContent='《神の恩恵》：サイコロ1個を好きな資源'+amount+'個に交換';nd.appendChild(sep);
 let ds=dieSelect(unusedDice());nd.appendChild(ds);
 [['y','💰 資金'],['p','🍖 食料'],['r','⚔️ 兵力']].forEach(([c,label])=>{let b=document.createElement('button');b.className='cost-choice';b.textContent=label+' +'+amount;b.onclick=()=>{let used=useDie(ds.value);if(!used)return alert('未使用のサイコロを選んでください。');used.used=false;cardCommands.change('convert',3,{kind:'die',dieId:used.id,color:c,undo:true,record:true});renderGame()};nd.appendChild(b)});
}
// @kokoryo-end-section S0057

// @kokoryo-section S0062
 function cname(c){return c==='y'?'資金':c==='r'?'兵力':'食料'}
// @kokoryo-end-section S0062

// @kokoryo-section S0066

function vpLabel(c,p){return specialConfig(c).vpFormula?cardVP(c,p)+'VP':(c.vp===null?'?VP':fixedVP(c)+'VP')}
// Ver.0.3.216: 最終ターン通知は同期済みゲーム状態から毎回再構築する。
// DOMの通知だけを更新してもオンライン参加者には転送されない。
function renderSharedEndgameStatus(){
 const box=q('#gameover');if(!box)return;
 if(gameEnded){
  const scores=Array.from({length:playerCount},(_,p)=>({p,vp:totalVP(p)+((commandCounts[p]||0)*debtFinalVPPerCard(p)),cards:allFieldCards(p).length}));
  const bestVP=Math.max(...scores.map(x=>x.vp)),top=scores.filter(x=>x.vp===bestVP),bestCards=Math.max(...top.map(x=>x.cards)),winners=top.filter(x=>x.cards===bestCards);
  box.className='notice endgame-final';
  box.innerHTML='<strong>ゲーム終了</strong><div style="margin-top:6px">'+scores.map(x=>'P'+(x.p+1)+'：'+x.vp+'VP／設置カード'+x.cards+'枚／負債'+(commandCounts[x.p]||0)+'枚').join('<br>')+'</div><div style="margin-top:8px"><strong>'+winners.map(x=>'P'+(x.p+1)).join('・')+' の勝利</strong></div>'+((onlineDebugMode||realOnlineMainMode)?'<div style="margin-top:12px"><button id="onlineReturnLobby" type="button" class="primary">ロビーへ戻る</button></div>':'');
  const rb=q('#onlineReturnLobby');if(rb)rb.onclick=confirmReturnToLobby;
  box.appendChild(playLogDownloadButton());return;
 }
 if(endgameStarter!==null){
  box.className='notice endgame-progress';
  box.innerHTML='<strong>⚑ ゲーム終了処理中</strong><div>P'+(endgameStarter+1)+'が'+gameSettings.winVP+'VP到達｜残り最終ターン：'+endgameRemaining+'人</div>';
  return;
 }
 box.className='notice hidden';box.innerHTML='';
}
// @kokoryo-end-section S0066

// @kokoryo-section S0068

function effectText(c){
 if(c?.effectText)return c.effectText;
 if(c.special==='talentRecruit')return '雇用可能な任意の雇用キャラクターを1人雇用する。';
 if(c.special==='scorchedEarth')return 'このカードを設置したとき、自分の場の通常カードを1枚選んで捨て札にする。\nその後、各プレイヤーの場の通常カードを1枚ずつ選んで捨て札にする。';
 if(c.special==='greatRefresh')return 'このカードを設置したとき、全プレイヤーは通常カードと命令書をすべて捨て札にし、その合計枚数と同じ枚数の通常カードを引く。\nその後、各プレイヤーは自身が捨て札にしたカード2枚につき、資金・食料・兵力をそれぞれ1個ずつ獲得する。';
 if(c.special==='changeOfHeart')return '上位レジェンド。設置：資金24。3VP。他のプレイヤーの雇用キャラクター1人を選び、自分のものにする。雇用枠が満杯でも4人目として保持できる。';
 if(c.special==='resourceWipe')return '上位レジェンド。5VP。ターン開始時、他のターン開始時効果の後、真下の下位レジェンドがない場合に無条件で取得できる。取得時、全プレイヤーの全資源を捨て、このターンを終了する。';
 if(c.special==='abilityCopy')return '上位レジェンド。設置：🎲1～6各1＋資金4＋食料4＋兵力4。10VP。ターン開始時、場に存在するキャラクターの固有能力を1つ選び、このターン使用できる。初回限定部分は発動しない。';
 if(c.special==='amanomurakumo')return '上位レジェンド。設置：2・3・4・5のいずれか1種類の同じ出目を8個。VP-5。設置時、即座にゲームを終了する。';
 if(c.special==='mayqueen')return '上位レジェンド。設置：🎲2×3＋資金16。8VP。ターン開始時、自分の設置済みカード1枚を選び、そのターン開始時効果を追加で2回発動する。';
 if(c.special==='eggharp')return '上位レジェンド。設置：🎲5×3＋兵力12。0VP。設置時、手札または公開市場から好きなカードをコストを支払わず設置する。これを4回行う。';
 if(c.special==='legendmine')return '「鉱山」のターン開始時に獲得する資金を3個増やす。\n「鉱山」1枚につきVPを2増やす。';
 if(c.special==='legendfarm')return '「農場」のターン開始時に獲得する食料を3個増やす。\n「農場」1枚につきVPを2増やす。';
 if(c.special==='legendbarracks')return '「兵舎」のターン開始時に獲得する兵力を3個増やす。\n「兵舎」1枚につきVPを2増やす。';
 if(c.special==='plan')return '設置：兵力2。1ターンに1回、サイコロ1個を振り直す。';
 if(c.special==='adjust')return '設置：兵力4。1ターンに1回、サイコロ1個の出目を±1する。';
 if(c.special==='restrict')return '設置：兵力3。1ターンに1回、サイコロ1個の出目を1にする。';
 if(c.special==='permit')return '設置：兵力3。1ターンに1回、サイコロ1個の出目を6にする。';
 if(c.special==='mine')return '設置：🎲1または2＋資金2。ターン開始時、資金を1個獲得する。';
 if(c.special==='farm')return '設置：🎲3または4＋食料2。ターン開始時、食料を1個獲得する。';
 if(c.special==='barracks')return '設置：🎲5または6＋兵力2。ターン開始時、兵力を1個獲得する。';
 if(c.special==='commandroom')return '設置：🎲3または4＋資金3＋兵力1。ターン開始時、命令書を1枚獲得する。';
 if(c.special==='warehouse')return '設置：🎲1・3・5のいずれか。手札上限+2。';
 if(c.special==='church')return '設置：🎲1または4＋資金3＋食料1。ターン開始時、通常カードを山札から1枚引く。';if(c.special==='elekiter')return '設置：🎲2＋🎲5＋資金1＋兵力1＋食料1。設置後、ターン中1回、サイコロ1個を使用済みにして資金・兵力・食料を1個ずつ獲得し、命令書を1枚獲得。使用済みにするサイコロはサイコロのみ。';if(c.special==='nanban')return '設置：任意のサイコロ2個＋資金2＋兵力2＋食料2。ターン開始時、資金・兵力・食料から1種類を選び2個獲得。';if(c.special==='cursedclock')return '設置：🎲5または🎲6＋食料3。設置時、資金・兵力・食料を3個ずつ獲得。設置時効果は仮設置した瞬間に発動。';if(c.special==='tenkucat')return '設置：🎲1＋🎲6＋資金2＋兵力1＋食料2＋正式設置済みの他のマーケットカード1枚を捨てる。ターン開始時、資金・兵力・食料から1種類を選び1個獲得。';if(c.special==='ninjaguild')return '設置：🎲1または🎲2＋資金5。条件発動：他のプレイヤーがサイコロで1の目（命令書除く）を出すたび、そのプレイヤーは負債を1枚獲得し、あなたは資金を獲得。黄の獲得数は2人プレイ3個／3人プレイ2個／4人プレイ1個。';if(c.special==='paneteria')return '設置時、公開カードをすべて捨て札にし、公開カードが上限に達するまで補充する。その後、このカードを設置したプレイヤーから順に、各プレイヤーは公開カードを1種類選び、その種類のカードをすべて手札に加える。';if(c.special==='lordmeeting')return '設置時、自分は命令書を3枚引く。その後、他のプレイヤーは順に命令書を1枚ずつ引く。';if(c.special==='blackcasino')return '設置時、山札の一番上のカードを自分の場に設置する。';if(c.special==='greatermine')return '設置する際、設置済みの「鉱山」1枚を捨て札にすることで、サイコロを消費せずに設置できる。ターン開始時、資金を3獲得する。';if(c.special==='greaterfarm')return '設置する際、設置済みの「農場」1枚を捨て札にすることで、サイコロを消費せずに設置できる。ターン開始時、食料を3獲得する。';if(c.special==='greaterbarracks')return '設置する際、設置済みの「兵舎」1枚を捨て札にすることで、サイコロを消費せずに設置できる。ターン開始時、兵力を3獲得する。';if(c.special==='greatercommand')return '設置する際、設置済みの「司令室」1枚を捨て札にすることで、サイコロを消費せずに設置できる。ターン開始時、命令書を2枚獲得する。';if(c.special==='famine')return '他のプレイヤーがサイコロで3を出すたび、そのプレイヤーは負債を1枚獲得する。食料を2人プレイなら3個、3人プレイなら2個、4人以上なら1個獲得する。';if(c.special==='swordhunt')return '他のプレイヤーがサイコロで6を出すたび、そのプレイヤーは負債を1枚獲得する。兵力を2人プレイなら3個、3人プレイなら2個、4人以上なら1個獲得する。';if(c.special==='laws')return '他のプレイヤーがサイコロで1を出すたび、そのプレイヤーは負債を1枚獲得する。資金を2人プレイなら3個、3人プレイなら2個、4人以上なら1個獲得する。';if(c.special==='graveyard')return '1ターンに1回、任意の資源を1個消費することで、捨て札から通常カードを1枚手札に加える。';if(c.special==='landgrab')return '他のプレイヤーがカードを設置するたび、資金を2人プレイなら3個、3人プレイなら2個、4人以上なら1個獲得する。';if(c.special==='bandit')return 'ターン開始時、資源を合計5個以上所持している他のプレイヤー1人につき、資金を2人プレイなら3個、3人プレイなら2個、4人以上なら1個獲得する。';if(c.special==='publicmarket')return '1ターンに1回、資金2個を消費することで、公開カードを1種類選び、そのカードをすべて手札に加える。その後、手札を1枚捨てる。効果終了時、公開カードに空きがある場合、上限まで補充する。';if(c.special==='scout')return '雇用枠に空きがある場合のみ設置できる。このカードを捨て札にすることで、雇用を1回行う。';if(c.special==='treasureship')return '設置：資金・兵力・食料のいずれか1種類のパワーを30個支払う。常時発動：このカードのVPは、あなたが設置したスタンダードカードのVP合計の2倍。';if(c.special==='inadamashii')return '設置：設置済みのマーケットカードを8枚捨て札にする。常時発動：所有しているパワー3個につき1VP（端数切り捨て・色不問）。';return '現在、このカードの効果テキストは未登録です。'}
// @kokoryo-end-section S0068

// @kokoryo-section S0070

function addHandPreview(parent,c){let w=document.createElement('div');w.className='hand-card-wrap'+(handCardLikelyInstallable(c)?'':' unavailable');let v=card(c,1,false);let ef=document.createElement('div');ef.className='card-effect-inline';ef.replaceChildren(cardInfoSections(c));v.appendChild(ef);w.appendChild(v);let st=document.createElement('div');st.className='small';st.style.marginTop='5px';st.textContent=handCardLikelyInstallable(c)?'● 現在設置可能':'● 現在は設置不可';w.appendChild(st);parent.appendChild(w)}
function renderKomeActions(){let box=q('#komeactions');if(!box)return;let repayMult=debtRepayMultiplier(),depression=repayMult>1;box.innerHTML='手札の負債：'+(commandCounts[turn]||0)+'枚 ／ 負債置き場：'+komePlace+'枚'+(depression?' ／ 負債返済コスト×'+repayMult:'')+'　';if(!(commandCounts[turn]||0))return;if(depressionDebtLocked(turn)){box.append(' ／ 《世界恐慌》により負債は捨てられません。');return}let ds=dieSelect(unusedDice());let b1=document.createElement('button');b1.className='secondary';b1.textContent=depression?'サイコロで1枚返す':'サイコロで最大2枚返す';b1.disabled=!unusedDice().length;b1.onclick=()=>{let d=useDie(ds.value);if(!d)return alert('未使用のサイコロを選んでください。');let n=Math.min(Math.max(1,Math.floor(2/repayMult)),commandCounts[turn]);commandCounts[turn]-=n;komePlace+=n;renderGame()};box.append(ds,b1,'　');let bs=document.createElement('select');breadHands[turn].forEach((b,i)=>{let o=document.createElement('option');o.value=i;o.textContent='📜'+breadLabel(b);bs.appendChild(o)});let b2=document.createElement('button');b2.className='secondary';b2.textContent=repayMult>1?'命令書'+repayMult+'枚で1枚返す':'命令書で1枚返す';b2.disabled=breadHands[turn].length<repayMult;b2.onclick=()=>{let need=repayMult;if(breadHands[turn].length<need)return alert('命令書が足りません。');let idx=+bs.value;if(!breadHands[turn][idx])idx=0;let picks=[idx];if(need===2)picks.push(idx===0?1:0);picks.sort((a,b)=>b-a).forEach(i=>breadDiscard.push(breadHands[turn].splice(i,1)[0]));recycleBreadIfEmpty();commandCounts[turn]--;komePlace++;renderGame()};box.append(bs,b2)}
// @kokoryo-end-section S0070

// @kokoryo-section S0072

function castEffectText(e){
 if(!e)return '';
 if(e.abilityText)return e.abilityText;
 if(e.uniqueAbility)return characterAbilityText(e)||'《'+e.uniqueAbility+'》';
 if(e.chooseResource&&e.chooseDie)return 'ターン開始時：好きな資源を'+(e.amount||0)+'個獲得し、好きな出目のサイコロを1個獲得。';
 if(e.chooseResource)return 'ターン開始時：好きな資源を'+(e.amount||0)+'個獲得。';
 if(e.resource&&e.amount){let n=e.resource==='y'?'資金':e.resource==='p'?'食料':'兵力';return 'ターン開始時：'+n+'を'+e.amount+'個獲得。'}
 if(e.chooseDie)return 'ターン開始時：好きな出目のサイコロを1個獲得。';
 return '効果なし';
}
// @kokoryo-end-section S0072

// @kokoryo-section S0074

function appendActiveAbilityControls(parent,sourceType,sourceIndex,entity){
 if(!entity)return;
 if(entity.oracleUpgrade){
  let row=document.createElement('div');row.className='row';row.style.marginTop='6px';
  let sel=document.createElement('select');
  (employees[turn]||[]).forEach((x,i)=>{if(!oracleCanUpgradeTarget(x))return;let nx=oracleUpgradeTarget(x);if(nx){let o=document.createElement('option');o.value=i;o.textContent=castDisplayName(x)+' → '+castDisplayName(nx)+'（'+nx.rarity+'）';sel.appendChild(o)}});
  let b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='《神託》を使用';b.disabled=(hiredThisTurn&&!oracleAnyUsed())||oracleSourceUsed(sourceType,sourceIndex)||!sel.options.length||!unusedDice().length||powers[turn].y<5;
  b.onclick=()=>useOracleUpgrade(sourceType,sourceIndex,+sel.value);row.append(sel,b);parent.appendChild(row)
 }
 if(entity.tributeInstall){
  let row=document.createElement('div');row.className='row';row.style.marginTop='6px';
  let sel=document.createElement('select');
  (hands[turn]||[]).forEach((c,i)=>{let o=document.createElement('option');o.value=i;o.textContent=c.name;sel.appendChild(o)});
  let b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='《貢ぎ物》を使用';b.disabled=tributeSourceUsed(sourceType,sourceIndex)||!sel.options.length;
  b.onclick=()=>useTributeInstall(sourceType,sourceIndex,+sel.value);row.append(sel,b);parent.appendChild(row)
 }
}
// @kokoryo-end-section S0074

// @kokoryo-section S0076

function renderHireActions(){let box=q('#hireactions'),list=q('#employees');if(!box||!list)return;box.innerHTML='';list.innerHTML='';let staff=employees[turn]||[];
 let summary=document.createElement('div');summary.className='small';summary.textContent='雇用中 '+staff.length+'/'+effectiveHireLimit();list.appendChild(summary);
 let lord=CHARACTER_DATA[charOf(turn)]||{};if(lord.oracleUpgrade||lord.tributeInstall){let la=document.createElement('div');la.className='actionblock';let st=document.createElement('strong');st.textContent='領主能力';la.appendChild(st);appendActiveAbilityControls(la,'lord',-1,lord);list.appendChild(la)}
 if(copiedAbility==='神託'||copiedAbility==='貢ぎ物'){let ca=document.createElement('div');ca.className='actionblock';ca.appendChild(document.createTextNode('《パーフェクト・イミテーション》'));appendActiveAbilityControls(ca,'copy',-1,abilityProfile(copiedAbility));list.appendChild(ca)}
 if(staff.length){let grid=document.createElement('div');grid.className='employee-card-grid';staff.forEach((e,i)=>{let wrap=document.createElement('div');wrap.className='employee-card-wrap';wrap.appendChild(employeeCardView(e));appendActiveAbilityControls(wrap,'employee',i,employeeUniqueAbilitiesEnabled(turn)?e:null);if(staff.length>=effectiveHireLimit()&&isViewingOwnTurn()){let fire=document.createElement('button');fire.type='button';fire.className='secondary danger';fire.textContent='このキャラを解雇';fire.style.marginTop='6px';fire.onclick=()=>dismissEmployee(i);wrap.appendChild(fire)}grid.appendChild(wrap)});list.appendChild(grid)}else{let empty=document.createElement('div');empty.className='muted';empty.textContent='雇用キャラクターなし';list.appendChild(empty)}
 if(staff.length>=effectiveHireLimit()){box.textContent='雇用枠が上限です。雇用キャラクターの「このキャラを解雇」から1人解雇できます。';}else if(hiredThisTurn){box.textContent='このターンは雇用済みです。';}else{let b=document.createElement('button');b.className='primary hire-main-btn';b.textContent='雇用する';b.disabled=!isHireFree()&&(powers[turn].y<5||!unusedDice().length);b.onclick=openHireDiceModal;box.appendChild(b);}
 let syn=isViewingOwnTurn()?synthesisOptions(turn):[];if(syn.length){let area=document.createElement('div');area.className='actionblock';let title=document.createElement('strong');title.textContent='雇用合成';area.appendChild(title);let row=document.createElement('div');row.className='row';row.style.marginTop='6px';let sel=document.createElement('select');syn.forEach(x=>{let o=document.createElement('option');o.value=JSON.stringify(x);o.textContent=x.clrFusion?(castDisplayName(x.a)+'＋'+castDisplayName(x.m)+' → '+castDisplayName(x.b)):(x.a.name+(x.growthPromotion?'×1（成長促進）':(x.mimic?'＋モノマネ師':'×2'))+' → '+x.b.name);sel.appendChild(o)});let b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='融合する';b.onclick=()=>synthesizeCast(JSON.parse(sel.value));row.append(sel,b);area.appendChild(row);box.appendChild(area)}

}
// @kokoryo-end-section S0076

// @kokoryo-section S0078

function showDialogLog(){
 let m=q('#dialogLogModal'),e=q('#dialogLogList');e.innerHTML='';
 if(!dialogLog.length){let x=document.createElement('div');x.className='muted';x.textContent='まだダイアログはありません。';e.appendChild(x)}
 else dialogLog.forEach((x,i)=>{let d=document.createElement('div');d.className='notice';d.style.margin='6px 0';let h=document.createElement('strong');h.textContent=(i+1)+'. P'+x.turn+'ターン';let b=document.createElement('div');b.style.marginTop='4px';b.textContent=x.message;d.append(h,b);e.appendChild(d)});
 m.classList.remove('hidden');
}

function characterAbilityText(lord){if(!lord)return '';return abilityTextForEntity(lord)||lord.abilityText||''}
function renderOpponentTurnView(){
 let box=q('#opponentTurnView'),grid=q('#game .turngrid');
 if(!box||!grid)return false;
 let active=(onlineDebugMode||realOnlineMainMode)&&viewer!==turn;
 box.classList.toggle('hidden',!active);grid.style.display=active?'none':'';
 if(!active)return false;
 let me=viewer,opp=turn,myLord=CHARACTER_DATA[charOf(me)]||{},oppLord=CHARACTER_DATA[charOf(opp)]||{};
 box.innerHTML='';
 let head=document.createElement('div');head.className='row';head.innerHTML='<div><strong style="font-size:18px">P'+(opp+1)+' '+((realOnlineMainMode?realPlayerName(opp):onlineDebugPlayers[opp])||'')+' のターン</strong><div class="muted">相手の公開情報を確認中</div></div><div class="small">自分：P'+(me+1)+' '+((realOnlineMainMode?realPlayerName(me):onlineDebugPlayers[me])||'')+'</div>';if(onlineDebugMode||(realOnlineMainMode&&isRealLobbyHost())){let rb=document.createElement('button');rb.type='button';rb.className='secondary';rb.textContent='ロビーへ戻る';rb.onclick=confirmReturnToLobby;head.appendChild(rb)}if(realOnlineMainMode&&realLobbyChannel){let lb=document.createElement('button');lb.type='button';lb.className='secondary';lb.textContent='部屋から退出';lb.onclick=leaveRealOnlineLobby;head.appendChild(lb)}box.appendChild(head);
 let waitTools=document.createElement('div');waitTools.className='actionblock';
 let remaining=dice.filter(d=>!d.used);
 let diceTitle=document.createElement('div');diceTitle.innerHTML='<strong>相手の未使用サイコロ：'+remaining.length+'個</strong><span class="small"> （残り行動回数ではありません）</span>';
 let diceFaces=document.createElement('div');diceFaces.className='row';diceFaces.style.cssText='justify-content:flex-start;gap:6px;margin:8px 0';
 remaining.forEach(d=>{let chip=document.createElement('span');chip.className='power';chip.textContent='🎲'+d.value;diceFaces.appendChild(chip)});
 if(!remaining.length){let none=document.createElement('span');none.className='muted';none.textContent='未使用サイコロなし';diceFaces.appendChild(none)}
 let tools=document.createElement('div');tools.className='row';tools.style.cssText='justify-content:flex-start;gap:6px;flex-wrap:wrap';
 [['カード一覧',showCardList],['雇用カード一覧',showHireCardList],['捨て札',showDiscardPile],['ダイアログ履歴',showDialogLog],['追加ルール',showActiveRules]].forEach(([label,fn])=>{if(label==='追加ルール'&&q('#showActiveRules')?.classList.contains('hidden'))return;let btn=document.createElement('button');btn.type='button';btn.className='secondary';btn.textContent=label;btn.onclick=fn;tools.appendChild(btn)});
 waitTools.append(diceTitle,diceFaces,tools);box.appendChild(waitTools);
 let self=document.createElement('div');self.className='actionblock';self.innerHTML='<strong>自分の情報</strong><div class="powers" style="margin-top:7px"><span class="power">資金 <strong>'+powers[me].y+'</strong></span><span class="power">兵力 <strong>'+powers[me].r+'</strong></span><span class="power">食料 <strong>'+powers[me].p+'</strong></span><span>VP <strong>'+totalVP(me)+'</strong></span><span>命令書 <strong>'+breadHands[me].length+'</strong>枚</span><span>負債 <strong>'+(commandCounts[me]||0)+'</strong>枚</span></div>';let sh=document.createElement('div');sh.className='opponent-self-hand-grid';if(!hands[me].length){let e=document.createElement('div');e.className='muted';e.textContent='手札なし';sh.appendChild(e)}else hands[me].forEach(c=>{let w=document.createElement('div');w.className='online-info-card opponent-hand-card';let meta=document.createElement('div');meta.className='opponent-hand-meta';meta.innerHTML='<span class="small">'+(c.type==='S'?'STANDARD':c.type==='LEGEND'?'LEGEND':'NORMAL')+'</span><strong>'+escapeHtml(c.name)+'</strong>';let ef=document.createElement('div');ef.className='card-effect-inline';ef.textContent=effectText(c);w.append(meta,ef);sh.appendChild(w)});self.appendChild(sh);box.appendChild(self);
 let op=document.createElement('div');op.className='actionblock';op.innerHTML='<strong>相手の情報</strong><div style="margin-top:6px"><strong>'+oppLord.title+' '+oppLord.name+'</strong>　'+oppLord.gender+'</div><button type="button" class="secondary opponent-ability" style="margin-top:6px">《'+(oppLord.uniqueAbility||'能力なし')+'》</button><div class="small opponent-ability-text hidden" style="margin-top:6px"></div><div class="powers" style="margin-top:8px"><span class="power">資金 <strong>'+powers[opp].y+'</strong></span><span class="power">兵力 <strong>'+powers[opp].r+'</strong></span><span class="power">食料 <strong>'+powers[opp].p+'</strong></span><span>VP <strong>'+totalVP(opp)+'</strong></span><span>手札 <strong>'+hands[opp].length+'</strong>枚</span><span>命令書 <strong>'+breadHands[opp].length+'</strong>枚</span><span>負債 <strong>'+(commandCounts[opp]||0)+'</strong>枚</span></div>';box.appendChild(op);let oppPortrait=document.createElement('div');oppPortrait.className='lord-card-portrait';oppPortrait.style.cssText='width:110px;height:140px;margin-top:8px';renderLordPortrait(oppPortrait,charOf(opp),'相手キャラクターイラスト');op.insertBefore(oppPortrait,op.children[1]||null);
 let ab=op.querySelector('.opponent-ability'),at=op.querySelector('.opponent-ability-text');ab.onclick=()=>{at.textContent=abilityStackText(oppLord.uniqueAbility)+' '+(characterAbilityText(oppLord)||'効果なし');at.classList.toggle('hidden')};
 let fieldSec=document.createElement('div');fieldSec.className='actionblock';let fieldTitle=document.createElement('strong');fieldTitle.textContent='相手の設置済みカード';fieldSec.appendChild(fieldTitle);appendInstalledCardGrid(fieldSec,installedDisplayList(opp));box.appendChild(fieldSec);
 let emp=document.createElement('div');emp.className='actionblock';emp.innerHTML='<strong>相手の雇用キャラクター</strong>';let eg=document.createElement('div');eg.className='employee-card-grid';eg.style.marginTop='8px';if(!(employees[opp]||[]).length){let e=document.createElement('div');e.className='muted';e.textContent='雇用キャラクターなし';eg.appendChild(e)}else (employees[opp]||[]).forEach(c=>eg.appendChild(employeeCardView(c)));emp.appendChild(eg);box.appendChild(emp);return true;
}
function renderGame(){turnClockRender();playLogChanges('render');refreshActiveRulesButton();let lobbyBtn=q('#mainReturnLobby');if(lobbyBtn)lobbyBtn.classList.toggle('hidden',!(onlineDebugMode||(realOnlineMainMode&&isRealLobbyHost())));q('#cardDetailModal')?.classList.add('hidden');q('#installModal')?.classList.add('hidden');checkEndgameTrigger();renderSharedEndgameStatus();if(renderOpponentTurnView()){renderLegends();renderMarket();renderPlayers();renderParkChoice();return;}q('#turnwho').textContent='P'+(turn+1)+(realOnlineMainMode&&realPlayerName(turn)?' '+realPlayerName(turn):'')+'のターン';let charData=window.KOKORYO_CHARACTER_DATA||CHARACTER_DATA,lord=charData[charOf(turn)]||charData.P1||{};renderLordPortrait(q('#charportrait'),charData[charOf(turn)]?charOf(turn):'P1');q('#chartitle').textContent=lord.title||'';q('#charname').textContent=lord.name||'';q('#chargender').textContent=lord.gender||'';q('#charability').innerHTML='<strong>《'+(lord.uniqueAbility||'能力なし')+'》</strong>';q('#charnote').textContent='';renderTriggerNotices();let pw=powers[turn];q('#py').textContent=pw.y;q('#pr').textContent=pw.r;q('#pp').textContent=pw.p;q('#handcount').textContent=totalHandCount(turn);q('#breadhandcount').textContent=breadHands[turn].length;q('#currentvp').textContent=totalVP(turn);
try{renderBoardHand()}catch(err){console.error('renderBoardHand failed',err)}
try{renderHireActions()}catch(err){console.error('renderHireActions failed',err)}
let de=q('#dice');de.innerHTML='';dice.forEach(d=>{let x=document.createElement('div');x.className='die '+(d.used?'used':'');x.innerHTML='<strong>🎲 '+d.value+'</strong><div class="small">'+(d.used?'使用済み':cname(colorFor(d.value))+'対応')+'</div>';de.appendChild(x)});
q('#corodie').parentElement.style.display='none';let cs=q('#corodie');if(cs){cs.innerHTML='';unusedDice().forEach(d=>{let o=document.createElement('option');o.value=d.id;o.textContent='🎲'+d.value+'（#'+d.id+'）';cs.appendChild(o)})}
renderConversionActions();renderCharacterAnyResourceConversion();renderInvisibleHandActions();renderResourceExchange();renderUndoActions();
renderTurnStart();renderCardActions();q('#franpanel').classList.add('hidden');q('#sorapanel').classList.add('hidden');renderKomeActions();renderDebugActions();renderLegends();renderMarket();renderPlayers();renderParkChoice()}
function renderTriggerNotices(){
 let box=q('#triggernotices');
 if(!triggerNotices.length){box.classList.add('hidden');box.innerHTML='';return}
 let shown=[...triggerNotices].map(x=>{
  if(!(botMatchMode && botIsPlayer(turn)))return x;
  let msg=String(x);
  // Drawn cards and command sheets are private even when an effect names them.
  if(/ドロー|引きました|命令書|山札から|手札に加え/.test(msg)){
    msg=msg.replace(/「[^」]*」(?:「[^」]*」)*/g,'（非公開）');
  }
  return msg;
 });
 box.classList.remove('hidden');
 box.innerHTML='<strong>条件発動</strong><div style="margin-top:6px">'+shown.map(x=>'<div>'+x+'</div>').join('')+'</div>';
 shown.forEach(x=>addDialog(x));triggerNotices=[];
}
// @kokoryo-end-section S0078

// @kokoryo-section S0080

function turnStartResourceButtons(title,note,amount,handler){let row=document.createElement('div');row.className='turnstart-choice';let h=document.createElement('div');h.innerHTML='<strong>'+title+'</strong>'+(note?'<div class="small">'+note+'</div>':'');let buttons=document.createElement('div');buttons.className='turnstart-buttons';[['y','💰 資金'],['p','🍖 食料'],['r','⚔️ 兵力']].forEach(([v,label])=>{let b=document.createElement('button');b.className='secondary';b.textContent=label+(amount>1?' +'+amount:'');b.disabled=!eraGainAllowed(turn,v,'effect');b.onclick=()=>{if(eraGainAllowed(turn,v,'effect'))handler(v)};buttons.appendChild(b)});row.append(h,buttons);return row}
// @kokoryo-end-section S0080

// @kokoryo-section S0082

function renderTurnStart(){let panel=q('#turnstartpanel'),box=q('#turnstarteffects');box.innerHTML='';
 // 資源・追加ダイスの選択がすべて済むまではポスト特殊獲得を判定しない。
 if(turnStartPostPending&&pendingLordResource<=0&&pendingNanban<=0&&pendingTenkuCat<=0&&pendingSSRBonus<=0&&!pendingCastResourceChoices.length&&!pendingOverclockChoices.length){
  turnStartPostPending=false;
  panel.classList.add('hidden');
  const acquired=runTurnStartSpecialAcquirePhase('post');
  nightEscapePostAvailable=true;
  if(!acquired)resolveMayQueen();
  renderGame();
  return;
 }
if(pendingLordResource<=0&&pendingNanban<=0&&pendingTenkuCat<=0&&pendingSSRBonus<=0&&!pendingCastResourceChoices.length&&!pendingOverclockChoices.length){if(!nightEscapePostAvailable){panel.classList.add('hidden');return}panel.classList.remove('hidden');let eligible=hands[turn].some(c=>c.key==='N22')&&(commandCounts[turn]||0)>=5;if(!eligible){nightEscapePostAvailable=false;panel.classList.add('hidden');return}let row=document.createElement('div');row.className='turnstart-choice';row.innerHTML='<strong>ターン開始時の資源獲得後</strong><div class="small">《夜逃げ》を設置する場合はここで選択してください。</div>';if(eligible){let b=document.createElement('button');b.className='secondary';b.textContent='《夜逃げ》をコストなしで設置';b.onclick=()=>installNightEscape();row.appendChild(b)}let skip=document.createElement('button');skip.className='secondary';skip.textContent='通常の行動へ進む';skip.onclick=()=>{nightEscapePostAvailable=false;renderGame()};row.appendChild(skip);box.appendChild(row);return}panel.classList.remove('hidden');
 if(pendingOverclockChoices.length){let x=pendingOverclockChoices[0],label=x.label||('《オーバークロック》 '+x.name),total=x.total||10;box.appendChild(turnStartResourceButtons(label,'好きな資源を合計'+total+'個獲得します。残り'+x.remaining+'個',1,gainOverclockResource))}
 if(pendingLordResource>0)box.appendChild(turnStartResourceButtons('領主効果','好きな資源を1つ選んでください。残り'+pendingLordResource+'個',1,gainLordResource));
 if(pendingCastResourceChoices.length){let x=pendingCastResourceChoices[0];box.appendChild(turnStartResourceButtons(x.name,'好きな資源を1種類選んでください。残り'+pendingCastResourceChoices.length+'回',x.amount,gainCastResource))}
 if(pendingSSRBonus>0){let row=document.createElement('div');row.className='turnstart-choice';row.innerHTML='<strong>SSR雇用効果</strong><div class="small">好きな出目のサイコロを1個獲得してください。残り'+pendingSSRBonus+'回</div>';let buttons=document.createElement('div');buttons.className='turnstart-buttons turnstart-dice-buttons';for(let v=1;v<=6;v++){let b=document.createElement('button');b.className='secondary';b.textContent='🎲'+v;b.onclick=()=>gainSSRDie(v);buttons.appendChild(b)}row.appendChild(buttons);box.appendChild(row)}
 if(pendingNanban>0)box.appendChild(turnStartResourceButtons('南蛮煙管','獲得する資源を選んでください。残り'+pendingNanban+'回',2,gainNanban));
 if(pendingTenkuCat>0)box.appendChild(turnStartResourceButtons('天駆猫','獲得する資源を選んでください。残り'+pendingTenkuCat+'回',1,gainTenkuCat));
}

function optionSelect(values){let seen=new Set(),opts=[];values.forEach(v=>installCostOptions(v).forEach(x=>{if(seen.has(x.id))return;seen.add(x.id);opts.push(x)}));return makeChoicePicker(opts)}
// @kokoryo-end-section S0082

// @kokoryo-section S0084

function appendInstalledCardGrid(parent,list,emptyText='設置済みカードなし'){
 let g=document.createElement('div');g.className='board-hand-grid';
 if(!list.length){let e=document.createElement('div');e.className='muted';e.textContent=emptyText;g.appendChild(e)}
 else list.forEach(item=>{let c=item&&item.card?item.card:item,status=item&&item.card?(item.status||'設置'):'設置';let w=document.createElement('div');w.className='board-hand-card';let st=document.createElement('div');st.className='small';st.style.cssText='font-weight:800;margin-bottom:4px';st.textContent='状態：'+status;w.appendChild(st);w.appendChild(card(c,1,false));let ef=document.createElement('div');ef.className='small';ef.style.marginTop='4px';ef.textContent=effectText(c);w.appendChild(ef);g.appendChild(w)});
 parent.appendChild(g);
}
// @kokoryo-end-section S0084

// @kokoryo-section S0088

function renderCardActions(selectedHandIndex=null){
 let ha=q('#handactions'),ic=q('#installedcards');ha.innerHTML='';ic.innerHTML='';
 appendInstalledCardGrid(ic,installedDisplayList(turn));
 let lordForActions=CHARACTER_DATA[charOf(turn)];
 if(recreationRangeForTurn()>0){
  let b=document.createElement('button');b.className='secondary';b.style.margin='7px 0';b.textContent='《リクリエイション》を使用';b.disabled=!installed[turn].length||!hands[turn].length;b.onclick=useRecreation;ic.appendChild(b);
 }
 let handSpecials=hands[turn].map((c,i)=>({c,i})).filter(x=>(selectedHandIndex===null||x.i===selectedHandIndex)&&(x.c.type==='S'||x.c.installSpec||['elekiter','nanban','cursedclock','tenkucat','ninjaguild','paneteria','lordmeeting','blackcasino','greatermine','greaterfarm','greaterbarracks','greatercommand','famine','swordhunt','laws','graveyard','landgrab','bandit','publicmarket','scout','treasureship','inadamashii'].includes(x.c.special)));
 if(!handSpecials.length)ha.textContent='現在、実装済みの設置可能カードは手札にありません。';
 handSpecials.forEach(x=>{addHandPreview(ha,x.c);if(x.c.type==='S'){let row=document.createElement('div');row.style.margin='4px';let vals={mine:[1,2],farm:[3,4],barracks:[5,6],commandroom:[3,4],warehouse:[1,3,5],church:[1,4]}[x.c.special];let sel=vals?optionSelect(vals):null;let b=document.createElement('button');b.className='secondary';b.textContent=x.c.name+'を仮設置（'+x.c.costText+'）';if(sel)b.disabled=!sel.options.length;b.onclick=()=>installStandard(x.i,sel?sel.value:null);if(sel)row.append('使用 ',sel,' ');row.appendChild(b);ha.appendChild(row);return;}if(x.c.installSpec){renderPackInstall(ha,x);return}if(x.c.special==='tenkucat'){let row=document.createElement('div');row.style.margin='4px';let s1=costSelect(1),s6=costSelect(6);let trash=document.createElement('select');installed[turn].forEach((c,i)=>{let o=document.createElement('option');o.value=i;o.textContent=c.name+(installed[turn].filter(z=>z.name===c.name).length>1?' #'+(i+1):'');trash.appendChild(o)});let b=document.createElement('button');b.className='secondary';b.textContent='天駆猫を仮設置（資金2兵力1食料2＋設置済み1枚破棄）';b.disabled=!s1.options.length||!s6.options.length||installed[turn].length<1;b.onclick=()=>installTenkuCat(x.i,s1.value,s6.value,trash.value);row.append('🎲1 ',s1,' 🎲6 ',s6,' 捨てる設置済みカード ',trash,' ',b);ha.appendChild(row);return}if(x.c.special==='ninjaguild'){let row=document.createElement('div');row.style.margin='4px';let sel=document.createElement('select');[...installCostOptions(1),...installCostOptions(2)].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i).forEach(x=>{let o=document.createElement('option');o.value=x.id;o.textContent=x.label;sel.appendChild(o)});let b=document.createElement('button');b.className='secondary';b.textContent='忍者ギルドを仮設置（資金5）';b.disabled=!sel.options.length;b.onclick=()=>installNinjaGuild(x.i,sel.value);row.append('使用するサイコロ ',sel,' ',b);ha.appendChild(row);return}if(x.c.special==='paneteria'){let row=document.createElement('div');row.style.margin='4px';let sel=costSelect(null);let b=document.createElement('button');b.className='secondary';b.textContent='ナーロッパランドを仮設置';b.disabled=!sel.options.length;b.onclick=()=>installPaneteria(x.i,sel.value);row.append('使用するサイコロ ',sel,' ',b);ha.appendChild(row);return}if(x.c.special==='lordmeeting'){let row=document.createElement('div');row.style.margin='4px';let sel=optionSelect([1,6]);let b=document.createElement('button');b.className='secondary';b.textContent='領主会議を仮設置（🎲1/6＋資金4）';b.disabled=!sel.options.length||powers[turn].y<4;b.onclick=()=>installLordMeeting(x.i,sel.value);row.append('使用 ',sel,' ',b);ha.appendChild(row);return}
if(x.c.special==='blackcasino'){let row=document.createElement('div');row.style.margin='4px';let s2=costSelect(2),s5=costSelect(5);let b=document.createElement('button');b.className='secondary';b.textContent='開拓ラッシュを仮設置（食料5）';b.disabled=!s2.options.length||!s5.options.length;b.onclick=()=>installBlackCasino(x.i,s2.value,s5.value);row.append('🎲2 ',s2,' 🎲5 ',s5,' ',b);ha.appendChild(row);return}if(['greatermine','greaterfarm','greaterbarracks','greatercommand'].includes(x.c.special)){let cfg={greatermine:{a:1,b:2,res:'y',amt:5,base:'mine',baseName:'鉱山'},greaterfarm:{a:3,b:4,res:'p',amt:5,base:'farm',baseName:'農場'},greaterbarracks:{a:5,b:6,res:'r',amt:5,base:'barracks',baseName:'兵舎'},greatercommand:{a:3,b:4,res2:true,base:'commandroom',baseName:'司令室'}}[x.c.special];let row=document.createElement('div');row.style.margin='4px';let sa=costSelect(cfg.a),sb=costSelect(cfg.b);let up=document.createElement('select');let normal=document.createElement('option');normal.value='normal';normal.textContent='通常設置（サイコロ2個を消費）';up.appendChild(normal);installed[turn].forEach((c,i)=>{if(c.special===cfg.base){let o=document.createElement('option');o.value='up:'+i;o.textContent='アップグレード：'+cfg.baseName+'を捨て札（サイコロ消費なし）';up.appendChild(o)}});let b=document.createElement('button');b.className='secondary';b.textContent=x.c.name+'を仮設置';let hasUpgrade=up.options.length>1;b.disabled=(cfg.res2?(powers[turn].y<4||powers[turn].r<2):powers[turn][cfg.res]<cfg.amt)||(!hasUpgrade&&(!sa.options.length||!sb.options.length));b.onclick=()=>installGreaterAcquisition(x.i,x.c.special,sa.value,sb.value,up.value);row.append('設置方法 ',up,'　🎲'+cfg.a+' ',sa,' 🎲'+cfg.b+' ',sb,' ',b);ha.appendChild(row);return}if(['famine','swordhunt','laws','graveyard','landgrab','bandit','publicmarket','scout'].includes(x.c.special)){renderNewNormalInstall(ha,x);return}if(x.c.special==='treasureship'){let row=document.createElement('div');row.style.margin='4px';let sel=document.createElement('select');[['y','資金'],['r','兵力'],['p','食料']].forEach(([v,n])=>{let o=document.createElement('option');o.value=v;o.textContent=n;sel.appendChild(o)});let b=document.createElement('button');b.className='secondary';b.textContent='幽玄の寶船を仮設置（同色30）';b.onclick=()=>installTreasureShip(x.i,sel.value);row.append('支払う色 ',sel,' ',b);ha.appendChild(row);return}
if(x.c.special==='inadamashii'){let row=document.createElement('div');row.style.margin='4px';let b=document.createElement('button');b.className='secondary';b.textContent='稲魂を仮設置（設置済み8枚破棄）';b.disabled=installed[turn].length<8;b.onclick=()=>installInadamashii(x.i);row.append(b);ha.appendChild(row);return}
if(x.c.special==='cursedclock'){let row=document.createElement('div');row.style.margin='4px';let sel=document.createElement('select');[...installCostOptions(5),...installCostOptions(6)].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i).forEach(x=>{let o=document.createElement('option');o.value=x.id;o.textContent=x.label;sel.appendChild(o)});let b=document.createElement('button');b.className='secondary';b.textContent='呪怨の懐中時計を仮設置（食料3）';b.disabled=!sel.options.length;b.onclick=()=>installCursedClock(x.i,sel.value);row.append('使用するサイコロ ',sel,' ',b);ha.appendChild(row);return}let b=document.createElement('button');b.className='secondary';b.style.margin='4px';if(x.c.special==='elekiter'){let s2=costSelect(2),s5=costSelect(5);b.textContent='エレキテル研究所を仮設置（資金1兵力1食料1）';b.disabled=!s2.options.length||!s5.options.length;b.onclick=()=>installElekiter(x.i,s2.value,s5.value);let row=document.createElement('div');row.append('🎲2 ',s2,' 🎲5 ',s5,' ',b);ha.appendChild(row);return}else if(x.c.special==='nanban'){let sa=costSelect(null),sb=costSelect(null);b.textContent='南蛮煙管を仮設置（資金2兵力2食料2）';b.disabled=installCostOptions(null).length<2;b.onclick=()=>installNanban(x.i,sa.value,sb.value);let row=document.createElement('div');row.append('サイコロ① ',sa,' ② ',sb,' ',b);ha.appendChild(row);return}ha.appendChild(b)});
 let deadCount=(CHARACTER_DATA[charOf(turn)]?.deadMansTrigger?1:0)+(employeeUniqueAbilitiesEnabled(turn)?(employees[turn]||[]):[]).filter(e=>e.deadMansTrigger).length+(copiedAbility==='デッドマンズトリガー'?1:0);if(deadCount){let row=document.createElement('div');row.className='actionblock';let sel=document.createElement('select');hands[turn].forEach((c,i)=>{let o=document.createElement('option');o.value=i;o.textContent=c.name;sel.appendChild(o)});let b=document.createElement('button');b.className='secondary';b.textContent='《デッドマンズトリガー》：通常手札1枚→命令書'+deadCount+'枚';b.disabled=!hands[turn].length;b.onclick=()=>{let i=+sel.value;if(!hands[turn][i])return;cardCommands.move(hands[turn][i],'hand','discard');cardCommands.draw('command',deadCount);renderGame()};row.append('捨てる通常手札 ',sel,' ',b);ha.appendChild(row)}
 let active=installed[turn].filter(c=>c.special==='elekiter');
 active.forEach((c,i)=>{let row=document.createElement('div');row.style.margin='5px 0';let sel=document.createElement('select');unusedDice().forEach(d=>{let o=document.createElement('option');o.value=d.id;o.textContent='🎲'+d.value+'（#'+d.id+'）';sel.appendChild(o)});let b=document.createElement('button');b.className='secondary';b.textContent=elekiterUsed[turn]?'使用済み':'研究所を使用';b.disabled=elekiterUsed[turn]||!unusedDice().length;b.onclick=()=>useElekiter(sel.value);row.append('エレキテル研究所：サイコロ1個 → 資金1・兵力1・食料1　',sel,b);ic.appendChild(row)});
 installed[turn].filter(c=>c.special==='nanban').forEach(c=>{let d=document.createElement('div');d.style.margin='5px 0';d.textContent='南蛮煙管：ターン開始時に資金・兵力・食料から1種類を選び2個獲得';ic.appendChild(d)});
 installed[turn].filter(c=>c.special==='cursedclock').forEach(c=>{let d=document.createElement('div');d.style.margin='5px 0';d.textContent='呪怨の懐中時計：設置済み';ic.appendChild(d)});
 installed[turn].filter(c=>c.special==='tenkucat').forEach(c=>{let d=document.createElement('div');d.style.margin='5px 0';d.innerHTML='<strong>天駆猫</strong>：ターン開始時に資金・兵力・食料から1種類を選び1個獲得'+(c.image?'<img class="installedimg zoomable" src="'+c.image+'" alt="天駆猫">':'');ic.appendChild(d)});
 installed[turn].filter(c=>c.special==='ninjaguild').forEach(c=>{let d=document.createElement('div');d.style.margin='5px 0';d.innerHTML='<strong>忍者ギルド</strong>：他プレイヤーの出目1で条件発動'+(c.image?'<img class="installedimg zoomable" src="'+c.image+'" alt="忍者ギルド">':'');ic.appendChild(d)});
 installed[turn].filter(c=>c.special==='paneteria').forEach(c=>{let d=document.createElement('div');d.style.margin='5px 0';d.textContent='ナーロッパランド：設置済み';ic.appendChild(d)});
 installed[turn].filter(c=>c.special==='blackcasino').forEach(c=>{let d=document.createElement('div');d.style.margin='5px 0';d.textContent='開拓ラッシュ：設置済み';ic.appendChild(d)}); installed[turn].filter(c=>['greatermine','greaterfarm','greaterbarracks','greatercommand'].includes(c.special)).forEach(c=>{let d=document.createElement('div');d.style.margin='5px 0';d.textContent=c.name+'：'+effectText(c).replace(/^設置：[^。]+。/,'');ic.appendChild(d)});
 renderNewNormalInstalledActions(ic);
 installed[turn].filter(c=>['plan','adjust','restrict','permit'].includes(c.special)).forEach(c=>{let row=document.createElement('div');row.style.margin='5px 0';let sel=dieSelect(unusedDice());let b=document.createElement('button');b.className='secondary';b.disabled=!!stdAbilityUsed[c.id]||!unusedDice().length;b.textContent=stdAbilityUsed[c.id]?'使用済み':c.name+'を使用';if(c.special==='adjust'){let dir=document.createElement('select');[-1,1].forEach(v=>{let o=document.createElement('option');o.value=v;o.textContent=v<0?'−1':'+1';dir.appendChild(o)});b.onclick=()=>useStdAbility(c.id,c.special,sel.value,+dir.value);row.append(c.name+'：',sel,' ',dir,' ',b)}else{b.onclick=()=>useStdAbility(c.id,c.special,sel.value);row.append(c.name+'：',sel,' ',b)}ic.appendChild(row)});
 installed[turn].filter(c=>['mine','farm','barracks','commandroom','warehouse','church'].includes(c.special)).forEach(c=>{let d=document.createElement('div');d.style.margin='5px 0';d.textContent=c.name+'：'+effectText(c).replace(/^設置：[^。]+。/,'');ic.appendChild(d)});
 if(!installed[turn].length&&!temporary[turn].length)ic.textContent='設置済みカードなし';
}
// @kokoryo-end-section S0088

// @kokoryo-section S0090

function renderNewNormalInstall(parent,x){
 let c=x.c,row=document.createElement('div');row.style.margin='4px';let b=document.createElement('button');b.className='secondary';b.textContent=c.name+'を仮設置（'+c.costText+'）';
 if(c.special==='famine'){let a=costSelect(3),d=costSelect(3),e=costSelect(3);b.disabled=installCostOptions(3).length<3||powers[turn].p<3;b.onclick=()=>installNewNormal(x.i,[a.value,d.value,e.value]);row.append('🎲3 ',a,' 🎲3 ',d,' 🎲3 ',e,' ',b)}
 else if(c.special==='swordhunt'){let a=costSelect(6);b.disabled=!a.options.length||powers[turn].r<4;b.onclick=()=>installNewNormal(x.i,[a.value]);row.append('🎲6 ',a,' ',b)}
 else if(c.special==='laws'){b.disabled=powers[turn].y<5;b.onclick=()=>installNewNormal(x.i,[]);row.append(b)}
 else if(c.special==='graveyard'){let a=optionSelect([4,5]);b.disabled=!a.options.length||powers[turn].p<1||powers[turn].r<2;b.onclick=()=>installNewNormal(x.i,[a.value]);row.append('🎲4/5 ',a,' ',b)}
 else if(c.special==='landgrab'){let a=costSelect(2),d=costSelect(5);b.disabled=!a.options.length||!d.options.length||powers[turn].y<2||powers[turn].p<2||powers[turn].r<2;b.onclick=()=>installNewNormal(x.i,[a.value,d.value]);row.append('🎲2 ',a,' 🎲5 ',d,' ',b)}
 else if(c.special==='bandit'){let a=costSelect(null),d=costSelect(null),e=costSelect(null);b.disabled=installCostOptions(null).length<3||powers[turn].y<4||powers[turn].p<3;b.onclick=()=>installNewNormal(x.i,[a.value,d.value,e.value]);row.append('ANY ',a,' ANY ',d,' ANY ',e,' ',b)}
 else if(c.special==='publicmarket'){let a=costSelect(null);b.disabled=!a.options.length||powers[turn].y<1||powers[turn].p<1||powers[turn].r<1;b.onclick=()=>installNewNormal(x.i,[a.value]);row.append('ANY ',a,' ',b)}
 else if(c.special==='scout'){b.disabled=powers[turn].y<2||powers[turn].p<2||powers[turn].r<2||(employees[turn]||[]).length>=effectiveHireLimit();b.onclick=()=>installNewNormal(x.i,[]);row.append(b)}

 parent.appendChild(row)
}
// @kokoryo-end-section S0090

// @kokoryo-section S0093

function renderPackInstall(parent,x){
 let spec=x.c.installSpec||{};
 if(typeof spec.render==='function'){spec.render({parent,x,card:x.c,api:packRuntimeApi(turn),install:(choices=[])=>installPackCard(x.i,choices)});return}
 let row=document.createElement('div');row.style.margin='4px';let choices=[],faces=spec.faces||[];
 for(const face of faces){let sel=optionSelect(face);choices.push(sel);row.append('🎲'+face.join('/')+' ',sel,' ')}
 let anyNeed=typeof spec.any==='function'?Math.max(0,+spec.any({card:x.c,owner:turn,api:packRuntimeApi(turn)})||0):Math.max(0,+spec.any||0);
 for(let i=0;i<anyNeed;i++){let sel=costSelect(null);choices.push(sel);row.append('ANY'+(anyNeed>1?' '+(i+1):'')+' ',sel,' ')}
 let b=document.createElement('button');b.className='secondary';b.textContent=x.c.name+'を仮設置';let res=spec.resources||{};b.disabled=choices.some(sel=>!sel.options.length)||powers[turn].y<(res.y||0)||powers[turn].p<(res.p||0)||powers[turn].r<(res.r||0);b.onclick=()=>installPackCard(x.i,choices.map(sel=>sel.value));row.appendChild(b);parent.appendChild(row)
}
// @kokoryo-end-section S0093

// @kokoryo-section S0096

function renderPackFieldAction(parent,c){let spec=c.fieldAction;if(!spec)return;if(typeof spec.render==='function'){spec.render({parent,card:c,spec,owner:turn,api:packRuntimeApi(turn)});return}if(spec.type==='promoteCastPair'){let cost=spec.cost||{},used=organizationUsed.includes(c.id),by=organizationMaterialGroups(),rarities=['N','R','SR','SSR'].filter(r=>(by[r]||[]).length>=2&&packCastPool(upgradeRarity(r)).length);let wrap=document.createElement('div');wrap.className='actionblock';wrap.style.margin='5px';let label=document.createElement('div');label.textContent=used?'《'+c.name+'》：使用済み':'《'+c.name+'》 資金'+(cost.y||0)+'・食料'+(cost.p||0)+'・兵力'+(cost.r||0);wrap.appendChild(label);if(!used&&rarities.length){let raritySel=document.createElement('select'),firstSel=document.createElement('select'),secondSel=document.createElement('select');rarities.forEach(r=>{let o=document.createElement('option');o.value=r;o.textContent=r+' ×2 → '+upgradeRarity(r);raritySel.appendChild(o)});function fillMaterials(){let cand=by[raritySel.value]||[];firstSel.innerHTML='';secondSel.innerHTML='';cand.forEach((x,i)=>{let text=castDisplayName(x.e)+' #'+(i+1);let o1=document.createElement('option');o1.value=x.i;o1.textContent=text;firstSel.appendChild(o1);let o2=document.createElement('option');o2.value=x.i;o2.textContent=text;secondSel.appendChild(o2)});if(secondSel.options.length>1)secondSel.selectedIndex=1}raritySel.onchange=fillMaterials;firstSel.onchange=()=>{if(secondSel.value===firstSel.value&&secondSel.options.length>1)secondSel.selectedIndex=(firstSel.selectedIndex+1)%secondSel.options.length};fillMaterials();let b=document.createElement('button');b.className='secondary';b.textContent='組織再編する';b.disabled=powers[turn].y<(cost.y||0)||powers[turn].p<(cost.p||0)||powers[turn].r<(cost.r||0);b.onclick=()=>usePromoteCastPair(c,spec,raritySel.value,firstSel.value,secondSel.value);let row=document.createElement('div');row.className='row';row.style.marginTop='6px';row.append(raritySel,firstSel,secondSel,b);wrap.appendChild(row)}else if(!used){let note=document.createElement('div');note.className='small';note.textContent='再編できる同レアリティの雇用キャラクターが2人いません。';wrap.appendChild(note)}parent.appendChild(wrap)}}
// @kokoryo-end-section S0096

// @kokoryo-section S0098

function renderPack2InstalledActions(ic){
 let st=installed[turn];
 st.forEach((c,i)=>{if(c.special!=='doubleHire')return;let b=document.createElement('button');b.className='secondary';b.textContent='《W雇用》を使う（この設置カードを捨てる）';b.disabled=hiredThisTurn||(employees[turn]||[]).length+2>effectiveHireLimit()||(!isHireFree()&&(!unusedDice().length||powers[turn].y<5));b.onclick=()=>useDoubleHire(i);ic.appendChild(b)});
 st.filter(c=>c.special==='hireCapacity').forEach(c=>{let d=document.createElement('div');d.className='small';d.textContent='《受け入れ準備》：雇用上限＋1';ic.appendChild(d)});
 st.filter(c=>c.special==='staffingAgency').forEach(c=>{let d=document.createElement('div');d.className='small';d.textContent='《派遣会社》：他プレイヤーの雇用時にも命令書＋資源を獲得';ic.appendChild(d)});
}
function renderNewNormalInstalledActions(ic){
 renderPack2InstalledActions(ic);
 installed[turn].forEach((c,i)=>{
  if(['famine','swordhunt','laws','landgrab','bandit'].includes(c.special)){let d=document.createElement('div');d.style.margin='5px 0';d.textContent=c.name+'：'+effectText(c).replace(/^設置：[^。]+。/,'');ic.appendChild(d)}
  if(c.special==='graveyard'){let b=document.createElement('button');b.className='secondary';b.style.margin='5px';b.textContent=normalCardActionUsed(graveyardUsed,c)?'オルフェンズ：使用済み':'オルフェンズを使用';b.disabled=normalCardActionUsed(graveyardUsed,c)||!discard.length;b.onclick=()=>useGraveyard(i);ic.appendChild(b)}
  if(c.special==='publicmarket'){let b=document.createElement('button');b.className='secondary';b.style.margin='5px';b.textContent=normalCardActionUsed(publicMarketUsed,c)?'交易場：使用済み':'交易場を使用';b.disabled=normalCardActionUsed(publicMarketUsed,c)||powers[turn].y<2||!market.length;b.onclick=()=>usePublicMarket(i);ic.appendChild(b)}
  if(c.special==='scout'){let b=document.createElement('button');b.className='secondary';b.style.margin='5px';b.textContent='スカウトを捨てて雇用';b.disabled=(employees[turn]||[]).length>=effectiveHireLimit();b.onclick=()=>useScout(i);ic.appendChild(b)}
  if(c.fieldAction)renderPackFieldAction(ic,c)
 })
}
// @kokoryo-end-section S0098

// @kokoryo-section S0100

function renderParkChoice(){
 let modal=q('#parkChoiceModal'),grid=q('#parkChoiceCards'),who=q('#parkChoiceWho'),taken=q('#parkChoiceTaken');
 finishEmptyParkChoices();
 if(!pendingParkPlayers.length){modal.classList.add('hidden');return}
 let p=pendingParkPlayers[0],g=groups();
 if(realOnlineMainMode&&viewer!==p){modal.classList.add('hidden');return;}
 if(botMatchMode && botIsPlayer(p)){
  modal.classList.add('hidden');
  if(!window.__botParkChoiceQueued){
   window.__botParkChoiceQueued=true;const clockParkToken=turnClockState.token;
   setTimeout(()=>{
    window.__botParkChoiceQueued=false;
    if(clockParkToken!==turnClockState.token)return;
    if(!pendingParkPlayers.length||pendingParkPlayers[0]!==p||!botMatchMode)return;
    let options=[...groups()].map(([key,cards])=>({key,cards,score:botScoreCard(cards[0])}));
    options.sort((a,b)=>b.score-a.score);
    let best=options.find(x=>totalHandCount(p)+x.cards.length<=handLimit(p))||options[0];
    if(best){while(totalHandCount(p)+best.cards.length>handLimit(p)&&hands[p].length){let order=hands[p].map((c,i)=>({i,score:botScoreCard(c)})).sort((a,b)=>a.score-b.score);discard.push(hands[p].splice(order[0].i,1)[0]);}}
    if(best){let got=market.filter(c=>c.key===best.key);market=market.filter(c=>c.key!==best.key);hands[p].push(...got);
     pendingParkTaken.push({player:p,name:got[0].name,count:got.length});
     addDialog('ナーロッパランド：P'+(p+1)+'が公開場から「'+got[0].name+'」'+(got.length>1?'×'+got.length:'')+'を獲得しました。');
    }
    pendingParkPlayers.shift();renderGame();
   },650);
  }
  return;
 }
 modal.classList.remove('hidden');grid.innerHTML='';
 who.textContent='P'+(p+1)+'：獲得する公開カードを直接タップしてください。';
 if(pendingParkTaken.length){taken.classList.remove('hidden');taken.innerHTML='<strong>ここまでの獲得</strong><div style="margin-top:5px">'+pendingParkTaken.map(x=>'P'+(x.player+1)+'：「'+x.name+'」'+(x.count>1?'×'+x.count:'')).join('<br>')+'</div>'}else{taken.classList.add('hidden');taken.innerHTML=''}
 g.forEach((arr,key)=>{
  let wrap=document.createElement('div'),b=card(arr[0],arr.length,false);
  b.classList.add('selectable-card');b.style.cursor='pointer';
  b.onclick=()=>{
   if(realOnlineMainMode&&viewer!==p)return;
   if(realOnlineMainMode){turnClockRequestPark(p,key);return}
   if(!applyOnlineParkPick(p,key))return;
  };
  let hint=document.createElement('div');hint.className='small';hint.style.cssText='text-align:center;font-weight:800;margin-top:4px';hint.textContent='タップして獲得';
  wrap.append(b,hint);grid.appendChild(wrap);
 });
}
// @kokoryo-end-section S0100

// @kokoryo-section S0103

function renderFranAction(){
 let panel=q('#franpanel'),box=q('#franaction');box.innerHTML='';
 if(charOf(turn)!=='fran'){panel.classList.add('hidden');return}panel.classList.remove('hidden');
 let field=installed[turn].map((c,i)=>({c,i})).filter(x=>x.c.vp!==null);
 let hand=hands[turn].map((c,i)=>({c,i})).filter(x=>x.c.vp!==null);
 if(!field.length||!hand.length){box.textContent='VPが数値で記載された設置済みカードと手札カードが必要です。?VPカードは対象外です。';return}
 let from=document.createElement('select');field.forEach(x=>{let o=document.createElement('option');o.value=x.i;o.textContent=x.c.name+'（'+fixedVP(x.c)+'VP）';from.appendChild(o)});
 let to=document.createElement('select');
 function refresh(){to.innerHTML='';let c=installed[turn][+from.value];if(!c)return;let v=fixedVP(c);hand.filter(x=>fixedVP(x.c)===v||fixedVP(x.c)===v+1).forEach(x=>{let o=document.createElement('option');o.value=x.i;o.textContent=x.c.name+'（'+fixedVP(x.c)+'VP）';to.appendChild(o)})}
 from.onchange=refresh;refresh();
 let b=document.createElement('button');b.className='secondary';b.textContent='捨ててコスト無視で仮設置';b.onclick=()=>useFran(+from.value,+to.value);box.append('捨てる設置済み ',from,' → 手札 ',to,' ',b);
}
function renderSoraAction(){let panel=q('#sorapanel'),box=q('#soraaction');if(charOf(turn)!=='sora'){panel.classList.add('hidden');return}panel.classList.remove('hidden');box.innerHTML='';if(!hands[turn].length){box.textContent='捨てられるマーケットカードが手札にありません。';return}let sel=document.createElement('select');hands[turn].forEach((c,i)=>{let o=document.createElement('option');o.value=i;o.textContent=c.name;sel.appendChild(o)});let b=document.createElement('button');b.className='secondary';b.textContent='捨てて命令書を獲得';b.onclick=()=>useSora(+sel.value);box.appendChild(sel);box.appendChild(b)}
// @kokoryo-end-section S0103

// @kokoryo-section S0105

let selectedHandDetailIndex=null;
function renderBoardHand(){
 let box=q('#boardHand');if(!box)return;box.innerHTML='';
 if(!hands[turn]?.length){let e=document.createElement('div');e.className='muted';e.textContent='通常カード・スタンダードカードの手札はありません。';box.appendChild(e);return}
 hands[turn].forEach((c,i)=>{
  try{
   let canInstall=false;
   try{canInstall=handCardLikelyInstallable(c)}catch(err){console.error('hand installability',c,err)}
   let w=document.createElement('div');w.className='board-hand-card'+(canInstall?' installable':'');
   let v=card(c,1,false);w.appendChild(v);
   let h=document.createElement('div');h.className='tap-hint';h.textContent='タップで確認';w.appendChild(h);
   w.onclick=()=>openHandCardDetail(i);box.appendChild(w)
  }catch(err){
   console.error('hand render',c,err);
   let w=document.createElement('div');w.className='board-hand-card';
   w.innerHTML='<div class="card"><strong>'+(c?.name||'カード')+'</strong><div class="small">表示エラー</div></div>';
   box.appendChild(w)
  }
 })
}
function openHandCardDetail(i){let c=hands[turn][i];if(!c)return;if(!q('#cardDetailModal').classList.contains('hidden')&&selectedHandDetailIndex===i){q('#cardDetailModal').classList.add('hidden');return;}selectedHandDetailIndex=i;q('#cardDetailTitle').textContent=c.name;q('#cardDetailView').innerHTML='';q('#cardDetailView').appendChild(card(c,1,false));q('#cardDetailView').onclick=()=>q('#cardDetailModal').classList.add('hidden');q('#cardDetailEffect').replaceChildren(cardInfoSections(c));let b=q('#cardDetailInstall');let supported=!!c.installSpec||c.type==='S'||['elekiter','nanban','cursedclock','tenkucat','ninjaguild','paneteria','lordmeeting','blackcasino','greatermine','greaterfarm','greaterbarracks','greatercommand','famine','swordhunt','laws','graveyard','landgrab','bandit','publicmarket','scout','treasureship','inadamashii'].includes(c.special);b.disabled=!supported;b.textContent=supported?(handCardLikelyInstallable(c)?'設置する':'設置操作を確認'):'このカードは設置操作未実装';q('#cardDetailModal').classList.remove('hidden')}
function openSelectedInstall(){let i=selectedHandDetailIndex,c=hands[turn][i];if(!c)return;q('#cardDetailModal').classList.add('hidden');q('#installModalTitle').textContent=c.name+'の設置';renderCardActions(i);q('#installModal').classList.remove('hidden')}
function showHandCards(){let m=q('#handModal'),e=q('#handList'),ex=q('#handExtras');q('#handModalTitle').textContent='P'+(turn+1)+'の手札';e.innerHTML='';if(!hands[turn].length){let x=document.createElement('div');x.className='muted';x.textContent='通常カード・スタンダードカードの手札はありません。';e.appendChild(x)}else{hands[turn].forEach(c=>{let w=document.createElement('div');w.appendChild(card(c,1,false));let t=document.createElement('div');t.className='small';t.style.marginTop='3px';t.replaceChildren(cardInfoSections(c));w.appendChild(t);e.appendChild(w)})}let orders=breadHands[turn].length?breadHands[turn].map(b=>'命令書'+breadLabel(b)).join(' / '):'なし';ex.textContent='命令書：'+orders+'　／　負債：'+(commandCounts[turn]||0)+'枚';m.classList.remove('hidden')}
function showHireCardList(){
 const modal=q('#hireCardListModal'),root=q('#hireCardListBody');
 if(!modal||!root)return;
 root.replaceChildren();
 const order=[['N','N'],['R','R'],['SR','SR'],['SSR','SSR'],['UR','UR'],['CLR','CLR']];
 const all=Object.values(CAST_TYPES).filter(e=>isPackEnabled(e.packId));
 order.forEach(([rarity,label])=>{
  const group=all.filter(e=>e.rarity===rarity).sort((a,b)=>String(a.id||'').localeCompare(String(b.id||''),'ja',{numeric:true}));
  if(!group.length)return;
  const heading=document.createElement('h3');heading.textContent=label+'（'+group.length+'種類）';heading.style.margin='14px 0 8px';root.appendChild(heading);
  const grid=document.createElement('div');grid.className='employee-card-grid';
  group.forEach(e=>{
   const wrap=document.createElement('div');wrap.className='employee-card-wrap';
   wrap.appendChild(employeeCardView(e));
   const note=document.createElement('div');note.className='small';note.style.marginTop='5px';
   note.textContent=e.id+(e.synthesisOnly||rarity==='CLR'?' ／ 通常ガチャ対象外':'');
   wrap.appendChild(note);grid.appendChild(wrap);
  });
  root.appendChild(grid);
 });
 if(!all.length)root.textContent='表示できる雇用カードがありません。';
 modal.classList.remove('hidden');
}
function showCardList(){
 let m=q('#cardListModal'),root=q('#cardListBody');root.innerHTML='';
 // ゲーム開始前は設定画面で現在選ばれているデッキ、開始後は実際に開始したデッキを参照する。
 let selectedDeck=!q('#setup').classList.contains('hidden')?(q('#deckPreset')?.value||'standard1'):(gameSettings.deckId||'standard1');
 let cfg=activeDeckConfig(selectedDeck);
 let normalKeys=new Set(cfg.normalKeys||[]);
 let lowerKeys=new Set(cfg.lowerLegendKeys||[]);
 let upperKeys=new Set(cfg.upperLegendKeys||[]);
 let groups=[
  ['スタンダードカード',STD_BASE],
  ['通常カード',NORMAL_BASE.filter(c=>c.implemented&&normalKeys.has(c.key))],
  ['Lower Legend',LEGEND_CATALOG.filter(c=>c.tier==='lower'&&lowerKeys.has(c.id))],
  ['Upper Legend',LEGEND_CATALOG.filter(c=>c.tier==='upper'&&upperKeys.has(c.id))]
 ];
 groups.forEach(([title,list])=>{
  if(!list.length)return;
  let h=document.createElement('h3');h.textContent=title;h.style.margin='12px 0 8px';root.appendChild(h);
  let grid=document.createElement('div');grid.className='cards';
  list.forEach(c=>{
   let w=document.createElement('div');w.className='card';w.style.justifyContent='flex-start';
   let imageSrc=resolvedContentImage(c);
   if(imageSrc){let img=document.createElement('img');img.src=imageSrc;img.alt=c.name;img.className='cardimg zoomable';img.onerror=()=>{let ph=document.createElement('div');ph.className='muted';ph.style.cssText='aspect-ratio:456/701;border:1px dashed #bbb;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#fff;margin-bottom:7px;text-align:center';ph.textContent='イラスト未設定';img.replaceWith(ph)};w.appendChild(img)}
   else{let ph=document.createElement('div');ph.className='muted';ph.style.cssText='aspect-ratio:456/701;border:1px dashed #bbb;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#fff;margin-bottom:7px;text-align:center';ph.textContent='イラスト未設定';w.appendChild(ph)}
   let name=document.createElement('strong');name.textContent=c.name;w.appendChild(name);
   w.appendChild(cardInfoSections(c));grid.appendChild(w)
  });
  root.appendChild(grid)
 });
 m.classList.remove('hidden')
}
function costTextForCard(c){
 if(c.costText)return c.costText;
 if(c.type==='LEGEND'||c.tier){
  if(c.special==='resourceWipe')return 'ターン開始時に特殊獲得';
  if(c.special==='amanomurakumo')return '🎲2/3/4/5の同じ出目×8';
  if(c.special==='mayqueen')return '🎲2×3＋資金16';
  if(c.special==='eggharp')return '🎲5×3＋兵力12';
  if(c.special==='abilityCopy'||c.special==='scorchedEarth')return '🎲1～6各1＋資金4＋食料4＋兵力4';
  if(c.special==='changeOfHeart')return '資金24';
  if(c.special==='talentRecruit')return '🎲任意×4＋資金20';
  if(c.special==='greatRefresh')return '🎲任意×4＋資金3＋食料3＋兵力3';
  if(c.faces&&c.faces.length)return '🎲'+c.faces.join('/')+'のいずれか×3＋'+(c.resource?c.resource+'8':(c.cost?.y?'資金'+c.cost.y+'＋':'')+(c.cost?.r?'兵力'+c.cost.r+'＋':'')+(c.cost?.p?'食料'+c.cost.p+'＋':'')+'特殊条件');
 }
 if(c.special==='paneteria')return '🎲任意×1';
 let t=effectText(c),m=t.match(/^設置：([^。]+)。/);return m?m[1]:'特殊条件';
}
function cleanCardEffect(c){
 let t=c.effectText||effectText(c);
 // 旧カードの説明に混在するコスト・VPを表示欄から取り除く。
 t=t.replace(/^設置：[^。]+。\s*/,'').replace(/^(?:下位レジェンド|上位レジェンド)。(?:設置：[^。]+。)?\s*/,'').replace(/^[-+]?\d+VP。\s*/,'');
 // 別々の効果の発動条件を段落の先頭に揃える（表示のみ）。
 t=t.replace(/([。！？])\s*(?=(?:ターン開始時|設置時|設置する際|1ターンに1回|効果終了時|獲得時|ターン終了時|他のプレイヤーが|他プレイヤーが))/g,'$1\n');
 return t||'効果なし';
}
// 表示専用: 効果文の資源名と数量を既存の資源アイコンへ置換する。
// 元の効果テキストとゲーム処理は変更しない。
function iconizeEffectText(text){
 let result=String(text??'');
 const icons={'資金':'💰','食料':'🍖','兵力':'⚔️'};
 // 「資金を3獲得」「資金2個を消費」「食料を2人プレイなら3個」等。
 result=result.replace(/(資金|食料|兵力)を(\d+)個?(?=\s*(?:獲得|消費|支払|捨て|得る|加える))/g,(_,name,n)=>icons[name]+'×'+n+'を');
 result=result.replace(/(資金|食料|兵力)(\d+)個(?=を(?:獲得|消費|支払|捨て))/g,(_,name,n)=>icons[name]+'×'+n);
 // 人数により変動する個数は、種類だけアイコン化し、数値は文章のまま残す。
 result=result.replace(/(資金|食料|兵力)を(?=\d+人プレイなら)/g,(_,name)=>icons[name]+'を');
 // 「資金・食料・兵力を1個ずつ」のような複数資源。
 result=result.replace(/(?:資金|食料|兵力)(?:・(?:資金|食料|兵力))+/g,m=>m.replace(/資金|食料|兵力/g,n=>icons[n]));
 // 「資金を獲得」等、数量なしの単純な表現。
 result=result.replace(/(資金|食料|兵力)を(?=(?:獲得|消費|支払|捨て))/g,(_,name)=>icons[name]+'を');
 return result;
}
function cardInfoSections(c){
 let wrap=document.createElement('div');wrap.className='card-info-sections';
 let items=[[c.type==='LEGEND'||c.tier?'獲得条件':'設置コスト',costTextForCard(c)],['VP',c.vp===null?'変動':String(c.vp??0)],['効果',cleanCardEffect(c)]];
 for(let [name,value] of items){let row=document.createElement('div');row.className='card-info-row';let title=document.createElement('div');title.className='card-info-label';title.textContent=name;let body=document.createElement('div');body.className='card-info-value';body.textContent=name==='効果'?iconizeEffectText(value):value;row.append(title,body);wrap.appendChild(row)}
 return wrap;
}
function showDiscardPile(){let m=q('#discardModal'),e=q('#discardList');e.innerHTML='';if(!discard.length){let x=document.createElement('div');x.className='muted';x.textContent='捨て札はありません。';e.appendChild(x)}else{discard.slice().reverse().forEach(c=>{let w=document.createElement('div');w.appendChild(card(c,1,false));let t=document.createElement('div');t.className='small';t.style.marginTop='3px';t.replaceChildren(cardInfoSections(c));w.appendChild(t);e.appendChild(w)})}m.classList.remove('hidden')}

function deckEditorCard(base,selected,toggle){
 let b=document.createElement('button');b.type='button';b.className='card deck-pick '+(selected?'on':'off');
 let ph=document.createElement('div');ph.className='muted';ph.style.cssText='aspect-ratio:456/701;border:1px dashed #bbb;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#fff;margin-bottom:7px;text-align:center';ph.textContent=base.image?'':'イラスト未設定';if(base.image){let img=document.createElement('img');img.src=base.image;img.className='cardimg';b.appendChild(img)}else b.appendChild(ph);
 let n=document.createElement('strong');n.textContent=base.name;b.appendChild(n);
 let m=document.createElement('div');m.className='small';m.textContent='VP：'+(base.vp||0);b.appendChild(m);
 let ef=document.createElement('div');ef.className='small';ef.style.marginTop='5px';ef.textContent=base.effectText||effectText(base);b.appendChild(ef);
 b.onclick=toggle;return b;
}
function openDeckEditor(){renderDeckEditor();refreshDeckSaveUI();q('#deckEditorModal').classList.remove('hidden')}
function renderDeckEditor(){
 let normal=NORMAL_BASE.filter(c=>c.implemented), lower=LEGEND_CATALOG.filter(c=>c.tier==='lower'), upper=LEGEND_CATALOG.filter(c=>c.tier==='upper');
 function fill(gridId,countId,list,key){
  let grid=q(gridId);grid.innerHTML='';let set=new Set(customDeck[key]);q(countId).textContent='採用 '+set.size+'種'+(key==='normalKeys'?'（'+set.size*4+'枚）':'');
  list.forEach(c=>grid.appendChild(deckEditorCard(c,set.has(c.key||c.id),()=>{let id=c.key||c.id,arr=customDeck[key],i=arr.indexOf(id);if(i>=0)arr.splice(i,1);else arr.push(id);renderDeckEditor()})));
 }
 fill('#customNormalGrid','#customNormalCount',normal,'normalKeys');fill('#customLowerGrid','#customLowerCount',lower,'lowerLegendKeys');fill('#customUpperGrid','#customUpperCount',upper,'upperLegendKeys');
}
function renderMarket(){let g=groups(),e=q('#market');e.innerHTML='';if(selectedMarketKey&&!g.has(selectedMarketKey))selectedMarketKey=null;g.forEach((arr,key)=>{let wrap=document.createElement('div');let b=card(arr[0],arr.length,false);b.classList.add('selectable-card');if(key===selectedMarketKey)b.classList.add('selected');let readOnly=(onlineDebugMode||realOnlineMainMode)&&viewer!==turn;b.onclick=()=>{if(!readOnly&&unusedDice().length){selectedMarketKey=key;renderMarket()}openCardImage({src:resolvedContentImage(arr[0])||'',alt:arr[0].name},arr[0],'market')};wrap.appendChild(b);let acquire=document.createElement('button');acquire.type='button';acquire.className='secondary';acquire.textContent='獲得';acquire.style.margin='4px 2px 8px';acquire.disabled=readOnly||!unusedDice().length;acquire.onclick=()=>{if((onlineDebugMode||realOnlineMainMode)&&viewer!==turn||!unusedDice().length)return;selectedMarketKey=key;renderMarket();q('#markettake').scrollIntoView({behavior:'smooth',block:'center'});};wrap.appendChild(acquire);e.appendChild(wrap)});let take=q('#markettake');take.innerHTML='';let readOnlyMarket=(onlineDebugMode||realOnlineMainMode)&&viewer!==turn;if(readOnlyMarket)selectedMarketKey=null;if(!unusedDice().length)selectedMarketKey=null;let chosen=!readOnlyMarket&&selectedMarketKey&&g.get(selectedMarketKey);let title=document.createElement('div');title.className='market-take-title';title.textContent=readOnlyMarket?'相手ターン中：公開カードは確認のみできます':(chosen?'「'+chosen[0].name+(chosen.length>1?' ×'+chosen.length:'')+'」を獲得':'獲得したい公開カードをタップしてください');take.appendChild(title);if(chosen){let note=document.createElement('div');note.className='small';note.textContent='消費する未使用サイコロをタップ';take.appendChild(note);let choices=document.createElement('div');choices.className='market-dice-choices';unusedDice().forEach(d=>{let btn=document.createElement('button');btn.className='primary market-die-btn';btn.textContent='🎲'+d.value+' で獲得';btn.onclick=()=>takeMarket(selectedMarketKey,d.id);choices.appendChild(btn)});if(!unusedDice().length){let no=document.createElement('div');no.className='notice';no.textContent='使用できる未使用サイコロがありません。';choices.appendChild(no)}take.appendChild(choices)}q('#types').textContent=g.size;q('#marketcount').textContent=market.length;q('#deckcount').textContent=deck.length;q('#discardcount').textContent=discard.length;q('#breaddeckcount').textContent=breadDeck.length;q('#breaddiscardcount').textContent=breadDiscard.length}
function openPlayerBoard(p,mode="board"){
 let old=q('#playerBoardOverlay');if(old)old.remove();
 let overlay=document.createElement('div');overlay.id='playerBoardOverlay';overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:99998;overflow:auto;padding:14px;box-sizing:border-box';
 let panel=document.createElement('div');panel.style.cssText='max-width:760px;margin:12px auto;background:var(--panel,#fff);color:var(--text,#222);background:#fff;color:#222;border-radius:12px;padding:14px';
 let heading=document.createElement('div');heading.className='row';let title=document.createElement('strong');title.textContent='P'+(p+1)+(mode==='hand'?' の手札内訳':mode==='installed'?' の設置済みカード':mode==='employees'?' の雇用キャラクター':mode==='vp'?' の勝利点':' の盤面');let close=document.createElement('button');close.textContent='閉じる';close.onclick=()=>overlay.remove();heading.append(title,close);panel.appendChild(heading);
 let status=document.createElement('div');status.className='small';status.textContent='手札 '+totalHandCount(p)+'枚 / 設置済み '+installed[p].length+'枚 / 雇用 '+(employees[p]||[]).length+'人 / VP '+totalVP(p)+'点 / 資金 '+powers[p].y+' / 兵力 '+powers[p].r+' / 食料 '+powers[p].p+' / 命令書 '+breadHands[p].length+'枚 / 負債 '+(commandCounts[p]||0)+'枚';panel.appendChild(status);
 function section(label){let h=document.createElement('h3');h.textContent=label;panel.appendChild(h);let area=document.createElement('div');area.style.cssText='display:flex;flex-wrap:wrap;gap:7px';panel.appendChild(area);return area}
 if(mode==='hand'){
  let area=section('手札の内訳');let data=[['通常・スタンダードカード',(hands[p]||[]).length],['命令書',(breadHands[p]||[]).length],['負債',commandCounts[p]||0]];
  data.forEach(([label,n])=>{let item=document.createElement('div');item.className='actionblock';item.style.cssText='flex:1;min-width:90px;text-align:center';item.textContent=label+'：'+n+'枚';area.appendChild(item)});
  let note=document.createElement('div');note.className='small';note.textContent='相手の手札のカード名・命令書の出目は非公開です。';panel.appendChild(note);
 }else if(mode==='vp'){
  let area=section('勝利点');let item=document.createElement('div');item.textContent='合計：'+totalVP(p)+'点';area.appendChild(item);
  let note=document.createElement('div');note.className='small';note.textContent='設置済みカードの詳細は「設置済み」から確認できます。';panel.appendChild(note);
 }else{
  if(mode==='board'||mode==='installed'){
   let field=section('設置済みカード');let cards=[...(installed[p]||[]),...(temporary[p]||[])];if(!cards.length)field.textContent='なし';cards.forEach(c=>{let tile=document.createElement('button');tile.type='button';tile.className='online-info-card';tile.style.cssText='padding:5px;min-width:115px;max-width:165px;flex:1 1 125px;text-align:left';let visual=card(c,1,false);visual.style.pointerEvents='none';tile.appendChild(visual);let detail=document.createElement('div');detail.className='small';detail.style.cssText='margin-top:5px;line-height:1.4';detail.appendChild(cardInfoSections(c));tile.appendChild(detail);tile.onclick=()=>openCardImage({src:resolvedContentImage(c)||'',alt:c.name},c,'installed');field.appendChild(tile)});
  }
  if(mode==='board'||mode==='employees'){
   let emp=section('雇用キャラクター');if(!(employees[p]||[]).length)emp.textContent='なし';(employees[p]||[]).forEach(c=>{let btn=document.createElement('button');btn.className='secondary';btn.textContent=(c.rarity||'')+' '+c.name;btn.onclick=()=>{let old=emp.querySelector('.employee-detail');if(old)old.remove();let detail=document.createElement('div');detail.className='notice employee-detail';detail.style.width='100%';detail.textContent=c.name+'：'+(castEffectText(c)||'効果なし');emp.appendChild(detail)};emp.appendChild(btn)});
  }
 }
 overlay.appendChild(panel);overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};document.body.appendChild(overlay);
}
function showPlayerCharacter(p){let c=(window.KOKORYO_CHARACTER_DATA||CHARACTER_DATA)[charOf(p)]||{};let existing=q('#playerCharacterOverlay');if(existing)existing.remove();let shade=document.createElement('div');shade.id='playerCharacterOverlay';shade.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px';let pane=document.createElement('div');pane.style.cssText='max-width:460px;width:100%;background:white;color:#222;padding:18px;border-radius:12px';let portrait=document.createElement('div');portrait.className='lord-card-portrait';portrait.style.cssText='width:110px;height:140px;margin:auto';renderLordPortrait(portrait,charOf(p));let name=document.createElement('h3');name.textContent=(c.title||'')+' '+(c.name||'');let ability=document.createElement('p');ability.textContent='《'+(c.uniqueAbility||'能力なし')+'》'+abilityStackText(c.uniqueAbility)+' '+(characterAbilityText(c)||'');let close=document.createElement('button');close.textContent='閉じる';close.onclick=()=>shade.remove();pane.append(portrait,name,ability,close);shade.appendChild(pane);shade.onclick=e=>{if(e.target===shade)shade.remove()};document.body.appendChild(shade)}
function renderPlayers(){
 let ps=q('#finalplayers');ps.innerHTML='';
 hands.forEach((h,p)=>{
  let x=document.createElement('div');x.className='player '+(p===turn?'active':'');
  let top=document.createElement('div');top.className='row';top.style.alignItems='center';
  let avatar=document.createElement('div');avatar.className='lord-card-portrait';avatar.style.cssText='width:52px;height:65px;flex-shrink:0;cursor:pointer';renderLordPortrait(avatar,charOf(p));avatar.onclick=()=>showPlayerCharacter(p);top.appendChild(avatar);
  let info=document.createElement('div');let label=document.createElement('button');label.className='secondary';label.textContent='P'+(p+1)+(realOnlineMainMode&&realPlayerName(p)?' '+realPlayerName(p):'');label.title='デバッグ時は視点を切り替え';label.onclick=()=>{if(onlineDebugMode&&!botMatchMode){viewer=p;renderGame()}else openPlayerBoard(p)};info.appendChild(label);let c=(window.KOKORYO_CHARACTER_DATA||CHARACTER_DATA)[charOf(p)]||{};let cname=document.createElement('div');cname.className='small';cname.textContent=c.name||'';info.appendChild(cname);top.appendChild(info);x.appendChild(top);
  let summary=document.createElement('div');summary.style.cssText='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin-top:8px';
  [['手札',totalHandCount(p)+'枚'],['設置済み',installed[p].length+'枚'],['雇用',(employees[p]||[]).length+'人'],['VP',totalVP(p)+'点']].forEach(([key,value])=>{let btn=document.createElement('button');btn.type='button';btn.className='secondary';btn.style.cssText='padding:7px 2px;font-size:12px;min-width:0';btn.textContent=key+' '+value;btn.onclick=()=>openPlayerBoard(p,key==='手札'?'hand':key==='設置済み'?'installed':key==='雇用'?'employees':'vp');summary.appendChild(btn)});x.appendChild(summary);
  ps.appendChild(x);
 });
}
function addFieldCardPreview(parent,c,isTemp){
 let b=document.createElement('button');b.type='button';b.className='secondary';b.style.margin='4px';b.style.textAlign='left';
 b.textContent=c.name+(isTemp?'（仮設置）':'')+' ['+vpLabel(c,turn)+']';
 b.onclick=()=>openCardImage({src:resolvedContentImage(c)||'',alt:c.name},c,'installed');parent.appendChild(b);
}
let pendingBreadAnyIndex=null,pendingResourceFrom=null;
function renderConversionActions(){
 let nd=q('#normalconvertchoices');if(nd){nd.innerHTML='';unusedDice().forEach(d=>{let b=document.createElement('button');b.className='cost-choice';b.textContent='🎲'+d.value+' → '+cname(colorFor(d.value))+' ×'+(3+conversionBonus());b.onclick=()=>turnClockConvertNormalDie(d.id);nd.appendChild(b)});if(!unusedDice().length)nd.innerHTML='<span class="small">未使用のサイコロなし</span>'}
 let bc=q('#breadconvertchoices'),bh=q('#breadhand'),ac=q('#breadanychoices');if(!bc)return;bc.innerHTML='';
 breadHands[turn].forEach((ord,i)=>{let b=document.createElement('button');b.className='cost-choice';b.textContent='📜'+breadLabel(ord)+(ord.value==='any'?'':' → '+cname(colorFor(ord.value)))+' ×2';b.onclick=()=>{
  if(ord.value==='any'){pendingBreadAnyIndex=i;renderConversionActions();renderCharacterAnyResourceConversion();return}
  cardCommands.change('convert',3,{kind:'command',index:i,undo:true,record:true});pendingBreadAnyIndex=null;renderGame()
 };bc.appendChild(b)});
 if(!breadHands[turn].length)bc.innerHTML='<span class="small">命令書なし</span>';bh.textContent=breadHands[turn].length?'所持：'+breadHands[turn].map(b=>'📜'+breadLabel(b)).join(' / '):'所持なし';ac.innerHTML='';
 if(pendingBreadAnyIndex!==null&&breadHands[turn][pendingBreadAnyIndex]?.value==='any'){ac.classList.remove('hidden');[['y','💰 資金'],['p','🍖 食料'],['r','⚔️ 兵力']].forEach(([c,label])=>{let b=document.createElement('button');b.className='cost-choice';b.textContent=label+' ×2';b.onclick=()=>{cardCommands.change('convert',3,{kind:'command',index:pendingBreadAnyIndex,color:c,undo:true,record:true});pendingBreadAnyIndex=null;renderGame()};ac.appendChild(b)})}else{pendingBreadAnyIndex=null;ac.classList.add('hidden')}
}
function renderCharacterAnyResourceConversion(){
 let box=q('#normalconvertchoices');if(!box||!isViewingOwnTurn())return;
 let amount=3+conversionBonus();if(!hasGodBlessingForTurn())return;
 let unused=unusedDice();if(!unused.length)return;
 let row=document.createElement('div');row.className='row';row.style.marginTop='6px';
 let s=document.createElement('select');unused.forEach(d=>{let o=document.createElement('option');o.value=d.id;o.textContent='🎲'+d.value;s.appendChild(o)});row.appendChild(s);
 [['y','💰 資金'],['p','🍖 食料'],['r','⚔️ 兵力']].forEach(([c,label])=>{let b=document.createElement('button');b.className='cost-choice';b.textContent='→ '+label+'×'+amount;b.onclick=()=>{cardCommands.change('convert',3,{kind:'die',dieId:+s.value,color:c,undo:true,record:true});renderGame()};row.appendChild(b)});
 box.appendChild(row);
}


function openHireDiceModal(){
 if(!isViewingOwnTurn())return alert('相手ターン中は雇用できません。');
 if(hiredThisTurn)return alert('雇用は1ターンに1回までです。');
 if((employees[turn]||[]).length>=effectiveHireLimit())return alert('雇用枠が上限です。');
 if(isHireFree())return hireEmployee(null);
 if(powers[turn].y<5)return alert('雇用には資金5が必要です。');
 let avail=unusedDice(),box=q('#hireDiceChoices');box.innerHTML='';
 if(!avail.length)return alert('使用できる未使用のサイコロがありません。');
 avail.forEach(d=>{let b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='🎲 '+d.value;b.onclick=()=>{q('#hireDiceModal').classList.add('hidden');hireEmployee(d.id)};box.appendChild(b)});
 q('#hireDiceModal').classList.remove('hidden');
}
function openEndTurnConfirm(){
 let avail=unusedDice();let info=q('#endTurnConfirmInfo');
 let items=[];
 if(avail.length)items.push('未使用サイコロ：'+avail.length+'個');
 if(!hiredThisTurn&&(employees[turn]||[]).length<effectiveHireLimit()&&(isHireFree()||(powers[turn].y>=5&&avail.length)))items.push('雇用：まだ実行できます');
 items.push('手札：'+totalHandCount(turn)+' / 上限'+handLimit(turn)+'枚');
 info.innerHTML=items.map(x=>'<div>・'+x+'</div>').join('');
 q('#endTurnConfirmModal').classList.remove('hidden');
}
// @kokoryo-end-section S0105

// @kokoryo-section S0107

function renderInvisibleHandActions(){let panel=q('#invisibleHandPanel'),box=q('#invisibleHandActions');if(!panel||!box)return;let n=invisibleHandCount();panel.style.display=n?'block':'none';box.innerHTML='';if(!n)return;if(!hands[turn].length){box.textContent='変換できる通常手札がありません。';return}let sel=document.createElement('select');hands[turn].forEach((c,i)=>{let o=document.createElement('option');o.value=i;o.textContent=c.name;sel.appendChild(o)});let row=document.createElement('div');row.className='cost-picker';[['y','💰 資金'],['p','🍖 食料'],['r','⚔️ 兵力']].forEach(([col,label])=>{let b=document.createElement('button');b.className='cost-choice';b.textContent=label+' +'+n;b.onclick=()=>useInvisibleHand(+sel.value,col);row.appendChild(b)});box.append('捨てる通常手札 ',sel,row)}
function renderResourceExchange(){
 let box=q('#resourceexchangechoices');if(!box)return;box.innerHTML='';let p=powers[turn],rate=exchangeRateFor();
 if(!pendingResourceFrom){let lab=document.createElement('div');lab.className='small';lab.textContent=rate+'個支払う資源'+(rate===1?'（《等価交換》）':'');box.appendChild(lab);let row=document.createElement('div');row.className='cost-picker';[['y','💰 資金'],['p','🍖 食料'],['r','⚔️ 兵力']].forEach(([c,label])=>{let b=document.createElement('button');b.className='cost-choice';b.textContent=label+' ×'+rate;b.disabled=p[c]<rate;b.onclick=()=>{pendingResourceFrom=c;renderResourceExchange()};row.appendChild(b)});box.appendChild(row)}
 else{let lab=document.createElement('div');lab.innerHTML='<strong>'+cname(pendingResourceFrom)+rate+'個</strong>を支払い → 受け取る資源を選択';box.appendChild(lab);let row=document.createElement('div');row.className='cost-picker';[['y','💰 資金'],['p','🍖 食料'],['r','⚔️ 兵力']].filter(([c])=>c!==pendingResourceFrom).forEach(([c,label])=>{let b=document.createElement('button');b.className='primary';b.textContent=label+' +1';b.onclick=()=>{cardCommands.change('exchange',{from:pendingResourceFrom,to:c,undo:true,record:true});pendingResourceFrom=null;renderGame()};row.appendChild(b)});let cancel=document.createElement('button');cancel.className='secondary';cancel.textContent='戻る';cancel.onclick=()=>{pendingResourceFrom=null;renderResourceExchange()};row.appendChild(cancel);box.appendChild(row)}
}
// @kokoryo-end-section S0107

// @kokoryo-section S0111

function showHandLimit(){let box=q('#limit');box.classList.remove('hidden');let nonRice=hands[turn].length+breadHands[turn].length;let lim=handLimit(turn),excess=totalHandCount(turn)-lim;if(excess<=0||(depressionProtectsDebtAtHandLimit()&&nonRice===0)){completeEnd();return}if(nonRice===0&&!depressionProtectsDebtAtHandLimit()&&!depressionDebtLocked(turn)){let n=Math.min(excess,commandCounts[turn]);commandCounts[turn]-=n;komePlace+=n;if(totalHandCount(turn)<=lim){completeEnd();return}}box.innerHTML='<strong>手札上限：'+lim+'枚</strong><div class="small">現在'+totalHandCount(turn)+'枚。'+(depressionProtectsDebtAtHandLimit()?'《世界恐慌》の効果中は負債を手札上限処理で捨てません。負債以外のカードをすべて捨てた後は、上限超過のままターンを終了できます。':'上限を超える場合、負債以外のカードから捨ててください。負債以外をすべて捨てても超過する場合のみ、超過分の負債を負債置き場へ戻します。')+'</div>';hands[turn].forEach((c,i)=>{let b=document.createElement('button');b.className='secondary';b.style.margin='5px';b.textContent=c.name;b.onclick=()=>{discard.push(hands[turn].splice(i,1)[0]);showHandLimit()};box.appendChild(b)});breadHands[turn].forEach((c,i)=>{let b=document.createElement('button');b.className='secondary';b.style.margin='5px';b.textContent='📜 命令書 '+breadLabel(c);b.onclick=()=>{breadDiscard.push(breadHands[turn].splice(i,1)[0]);recycleBreadIfEmpty();showHandLimit()};box.appendChild(b)})}
// @kokoryo-end-section S0111

// @kokoryo-section S0116


function setupCompactUI(){
 const panel=q('#freeActionsPanel'); if(!panel||panel.dataset.compact)return; panel.dataset.compact='1'; panel.classList.add('action-drawer');
 const title=panel.querySelector(':scope > strong'); if(title) title.style.display='none';
 const blocks=[...panel.querySelectorAll(':scope > .actionblock')];
 const undoBlock=document.createElement('div');undoBlock.className='actionblock';undoBlock.innerHTML='<strong>戻す</strong><div class="small">市場が変わっていない間だけ、戻したい操作を個別に選べます。</div><div id="undoactions" style="margin-top:6px"></div>';panel.appendChild(undoBlock);
 // 画面に常設する主要情報・行動。旧まじきんキャラ系はUIから退避する。
 const main=document.createElement('div');main.className='panel';main.id='mainActionPanel';main.innerHTML='<strong>自分の領地・手札</strong><div class="small" style="margin-top:4px">頻繁に使う行動はここから直接操作します。</div>';
 [1,9,11,12].forEach(i=>{if(blocks[i])main.appendChild(blocks[i])});
 const legendPanel=q('#legendArea')?.closest('.panel');if(legendPanel)legendPanel.parentElement.insertBefore(main,legendPanel);
 [3,7,8].forEach(i=>{if(blocks[i])blocks[i].style.display='none'});
 const head=document.createElement('div'); head.className='drawer-head'; head.innerHTML='<strong>コマンド</strong>';
 const close=document.createElement('button'); close.className='secondary drawer-close'; close.textContent='閉じる'; close.onclick=()=>panel.classList.remove('open'); head.appendChild(close);
 const tabs=document.createElement('div'); tabs.className='drawer-tabs';
 const groups=[{label:'変換',idx:[0,2]},{label:'資源交換',idx:[5]},{label:'市場入れ替え',idx:[6]},{label:'戻す',idx:[],extra:undoBlock},{label:'プレイログ',idx:[],extra:(()=>{const d=document.createElement('div');d.className='actionblock';d.appendChild(playLogDownloadButton());return d})()},{label:'デバッグ',idx:[10]}];
 function showGroup(n){groups.forEach((g,gi)=>{g.idx.forEach(i=>{if(blocks[i])blocks[i].style.display=gi===n?'block':'none'});if(g.extra)g.extra.style.display=gi===n?'block':'none'});}
 groups.forEach((g,i)=>{const bt=document.createElement('button');bt.className='secondary';bt.textContent=g.label;if(g.label==='デバッグ'){bt.id='debugCommandTab';bt.style.display='none'}bt.onclick=()=>showGroup(i);tabs.appendChild(bt)});
 panel.insertBefore(tabs,panel.firstChild); panel.insertBefore(head,panel.firstChild); showGroup(0);
 const end=q('#endturn'); if(end&&end.parentElement){const open=document.createElement('button');open.className='game-action-btn main-turn-btn';open.textContent='コマンド';open.onclick=()=>panel.classList.add('open');end.parentElement.insertBefore(open,end);}
}
// @kokoryo-end-section S0116

// @kokoryo-section S0120

function openCardImage(img,c=null,context='view',index=null){
 const src=img?.src||'',title=c?.name||img?.alt||'カード詳細';
 const modal=q('#imgmodal');
 if(!modal.classList.contains('hidden')&&modal.dataset.cardKey===(c?.key||title)&&modal.dataset.context===context){modal.classList.add('hidden');return}
 modal.dataset.cardKey=c?.key||title;modal.dataset.context=context;
 q('#modalimg').src=src;q('#modalimg').alt=title;q('#modalimg').classList.toggle('hidden',!src);
 q('#expandedCardTitle').textContent=title;
 const info=q('#expandedCardInfo');info.replaceChildren();
 if(c)info.appendChild(cardInfoSections(c));
 else {const note=document.createElement('div');note.className='small';note.textContent='カード情報はカード一覧から確認できます。';info.appendChild(note)}
 const action=q('#expandedCardAction'),hint=q('#expandedCardHint');action.classList.add('hidden');action.onclick=null;hint.textContent='';
 const own=!(onlineDebugMode||realOnlineMainMode)||viewer===turn;
 if(context==='market'){
  const hasMarketDie=unusedDice().length>0;
  action.textContent='獲得';action.disabled=!own||!hasMarketDie;action.classList.remove('hidden');
  if(own&&!hasMarketDie)hint.textContent='未使用サイコロがないため、このターンは獲得できません。';
  action.onclick=()=>{if(!own||!unusedDice().length)return;selectedMarketKey=c.key;modal.classList.add('hidden');renderMarket();q('#markettake').scrollIntoView({behavior:'smooth',block:'center'})};
 }else if(context==='hand'){
  action.textContent='設置';action.disabled=!own;action.classList.remove('hidden');
  action.onclick=()=>{if(!own||index==null)return;modal.classList.add('hidden');selectedHandDetailIndex=index;openSelectedInstall()};
 }else if(context==='legend'){
  action.textContent='設置';action.disabled=!own||c.taken||c.eraBlocked||(c.tier==='upper'&&!c.unlocked)||legendTakenThisTurn;action.classList.remove('hidden');
  action.onclick=()=>{if(action.disabled)return;modal.classList.add('hidden');takeLegend(c.id)};
 }else{hint.textContent='閲覧のみ';}
 modal.classList.remove('hidden');
}
// @kokoryo-end-section S0120

// @kokoryo-section S0130

function turnClockRender(){
 const s=turnClockState;if(!s)return;
 let box=q('#turnClockPanel');
 if(!box){box=document.createElement('section');box.id='turnClockPanel';box.className='notice';box.setAttribute('aria-label','プレイヤー別持ち時間');q('#game')?.prepend(box)}
 if(!box)return;
 box.innerHTML='<strong>持ち時間</strong> <span class="small">自分のターンのみ消費・終了時＋30秒（上限180秒）</span>';
 const row=document.createElement('div');row.className='row';row.style.cssText='justify-content:flex-start;gap:8px;flex-wrap:wrap;margin-top:6px';
 for(let p=0;p<playerCount;p++){
  const secs=Math.ceil((s.remaining[p]??TURN_CLOCK_INITIAL)/1000),el=document.createElement('span');
  el.className='power';el.dataset.clockPlayer=p;el.dataset.seconds=secs;
  const active=s.active===p&&!gameEnded;el.dataset.active=String(active);
  el.style.cssText=active?'border:2px solid #a36d00;background:#fff1b8;font-weight:700':'';
  el.textContent='P'+(p+1)+' '+secs+'秒 ('+Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0')+')'+(active?' ▶':'');row.appendChild(el);
 }
 box.appendChild(row);
}
// @kokoryo-end-section S0130
