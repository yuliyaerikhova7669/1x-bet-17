(function(){"use strict";var WALLET_KEY="mines_wallet";var START_BALANCE=1000;var TILE_COUNT=25;var HOUSE_EDGE=0.97;var BET_STEP=5;var BET_MAX=100000;var gridEl=document.getElementById("mines-grid");var walletEl=document.getElementById("wallet-value");var walletResetEl=document.getElementById("wallet-reset");var betInput=document.getElementById("bet-input");var betMinus=document.getElementById("bet-minus");var betPlus=document.getElementById("bet-plus");var minesSelect=document.getElementById("mines-select");var startBtn=document.getElementById("btn-start");var cashBtn=document.getElementById("btn-cash");var statusEl=document.getElementById("game-status");var multiplierEl=document.getElementById("multiplier-value");var payoutEl=document.getElementById("payout-value");var panelEl=document.getElementById("game-panel");if(!gridEl||!walletEl||!betInput||!minesSelect||!startBtn||!cashBtn||!statusEl||!multiplierEl||!payoutEl){return;}
var GEM_SVG='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+'<path d="M7 3h10l4.2 6L12 21.5 2.8 9 7 3z" fill="#4f46e5"/>'+'<path d="M8.6 9.6h6.8L12 19.4 8.6 9.6z" fill="#a5b4fc"/>'+'<path d="M7.6 4.6l1.9 3.4h5l1.9-3.4H7.6z" fill="#818cf8"/>'+"</svg>";var BOMB_SVG='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+'<circle cx="10.5" cy="14" r="7.2" fill="#1e293b"/>'+'<path d="M14.8 8.6l3-3.4" stroke="#1e293b" stroke-width="2.1" stroke-linecap="round" fill="none"/>'+'<circle cx="18.8" cy="4.3" r="1.9" fill="#dc2626"/>'+'<circle cx="8.4" cy="11.6" r="1.7" fill="#475569"/>'+"</svg>";var state={balance:loadBalance(),active:false,bet:0,mines:3,mineMap:[],picks:0,tiles:[]};function loadBalance(){var stored=null;try{stored=window.localStorage.getItem(WALLET_KEY);}catch(err){stored=null;}
if(stored===null||stored===""){return START_BALANCE;}
var value=Number(stored);if(!isFinite(value)||value<0){return START_BALANCE;}
return round2(value);}
function saveBalance(){try{window.localStorage.setItem(WALLET_KEY,String(state.balance));}catch(err){return;}}
function renderBalance(){walletEl.textContent=formatMoney(state.balance);}
function round2(value){return Math.round(value*100)/100;}
function formatMoney(value){var rounded=round2(value);if(rounded===Math.floor(rounded)){return String(rounded);}
return rounded.toFixed(2);}
function setStatus(text,mood){statusEl.textContent=text;statusEl.classList.remove("win","lose");if(mood){statusEl.classList.add(mood);}}
function multiplierFor(picks,mines){if(picks<1){return 1;}
var value=1;for(var i=0;i<picks;i+=1){value*=(TILE_COUNT-i)/(TILE_COUNT-mines-i);}
return value*HOUSE_EDGE;}
function currentMultiplier(){return multiplierFor(state.picks,state.mines);}
function renderStats(){var mult=currentMultiplier();multiplierEl.textContent=mult.toFixed(2)+"×";if(state.active&&state.picks>0){payoutEl.textContent=formatMoney(state.bet*mult);}else if(state.active){payoutEl.textContent=formatMoney(state.bet);}else{payoutEl.textContent="—";}}
function shuffledIndexes(){var order=[];var i;for(i=0;i<TILE_COUNT;i+=1){order.push(i);}
for(i=order.length-1;i>0;i-=1){var j=Math.floor(Math.random()*(i+1));var tmp=order[i];order[i]=order[j];order[j]=tmp;}
return order;}
function buildGrid(){gridEl.innerHTML="";state.tiles=[];for(var i=0;i<TILE_COUNT;i+=1){var tile=document.createElement("button");tile.type="button";tile.className="tile-67f944e2";tile.disabled=true;tile.setAttribute("aria-label","Tile "+(i+1));tile.innerHTML='<span class="tile-inner-67f944e2">'+'<span class="tile-face-67f944e2 tile-front-67f944e2"></span>'+'<span class="tile-face-67f944e2 tile-back-67f944e2"></span>'+"</span>";tile.addEventListener("click",makeTileHandler(i));gridEl.appendChild(tile);state.tiles.push(tile);}}
function makeTileHandler(index){return function(){onTilePick(index);};}
function revealTile(index,isMine,dim){var tile=state.tiles[index];if(!tile||tile.classList.contains("revealed-67f944e2")){return;}
var back=tile.querySelector(".tile-back-67f944e2");if(back){back.innerHTML=isMine?BOMB_SVG:GEM_SVG;}
tile.classList.add("revealed-67f944e2");if(isMine){tile.classList.add("boom-67f944e2");}
if(dim){tile.classList.add("dimmed-67f944e2");}
tile.disabled=true;}
function revealRemaining(dimAll){for(var i=0;i<TILE_COUNT;i+=1){if(!state.tiles[i].classList.contains("revealed-67f944e2")){revealTile(i,state.mineMap[i]===true,dimAll);}}}
function setTilesEnabled(enabled){for(var i=0;i<TILE_COUNT;i+=1){var tile=state.tiles[i];tile.disabled=!enabled||tile.classList.contains("revealed-67f944e2");}}
function setControlsLocked(locked){betInput.disabled=locked;betMinus.disabled=locked;betPlus.disabled=locked;minesSelect.disabled=locked;startBtn.disabled=locked;walletResetEl.disabled=locked;}
function readBet(){var value=Math.floor(Number(betInput.value));if(!isFinite(value)){return 0;}
return value;}
function clampBetInput(){var value=readBet();if(value<1){value=1;}
if(value>BET_MAX){value=BET_MAX;}
betInput.value=String(value);}
function nudgeBet(delta){if(state.active){return;}
var value=readBet()+delta;if(value<1){value=1;}
if(value>BET_MAX){value=BET_MAX;}
betInput.value=String(value);}
function startRound(){if(state.active){return;}
clampBetInput();var bet=readBet();if(bet<=0){setStatus("Enter a bet of at least 1.","lose");return;}
if(bet>state.balance){setStatus("That bet is more than your balance.","lose");return;}
state.bet=bet;state.mines=parseInt(minesSelect.value,10)||3;state.picks=0;state.balance=round2(state.balance-bet);saveBalance();renderBalance();buildGrid();var order=shuffledIndexes();state.mineMap=[];for(var i=0;i<TILE_COUNT;i+=1){state.mineMap.push(false);}
for(var m=0;m<state.mines;m+=1){state.mineMap[order[m]]=true;}
state.active=true;setControlsLocked(true);setTilesEnabled(true);cashBtn.disabled=true;renderStats();setStatus("Pick a tile. Cash out any time after the first gem.","");}
function endRound(){state.active=false;setTilesEnabled(false);cashBtn.disabled=true;setControlsLocked(false);renderStats();if(state.balance<1){setStatus("Balance is empty — press reset to refill the demo wallet.","lose");}}
function onTilePick(index){if(!state.active){return;}
var tile=state.tiles[index];if(!tile||tile.classList.contains("revealed-67f944e2")){return;}
if(state.mineMap[index]){revealTile(index,true,false);bust();return;}
state.picks+=1;revealTile(index,false,false);cashBtn.disabled=false;renderStats();var safeTiles=TILE_COUNT-state.mines;if(state.picks>=safeTiles){cashOut(true);return;}
setStatus(state.picks+" gem"+(state.picks===1?"":"s")+" found. Next pick or cash out?","");}
function bust(){var lost=state.bet;revealRemaining(true);setStatus("Boom! The mine took your "+formatMoney(lost)+" bet.","lose");if(panelEl){panelEl.classList.remove("jolt-67f944e2");void panelEl.offsetWidth;panelEl.classList.add("jolt-67f944e2");}
endRound();}
function cashOut(cleared){if(!state.active||state.picks<1){return;}
var winnings=round2(state.bet*currentMultiplier());state.balance=round2(state.balance+winnings);saveBalance();renderBalance();revealRemaining(true);if(cleared){setStatus("Perfect clear! You collected "+formatMoney(winnings)+".","win");}else{setStatus("Cashed out "+formatMoney(winnings)+" at "+
currentMultiplier().toFixed(2)+"×.","win");}
endRound();}
function resetWallet(){if(state.active){return;}
state.balance=START_BALANCE;saveBalance();renderBalance();renderStats();setStatus("Demo wallet refilled to "+START_BALANCE+".","");}
startBtn.addEventListener("click",startRound);cashBtn.addEventListener("click",function(){cashOut(false);});walletResetEl.addEventListener("click",resetWallet);betMinus.addEventListener("click",function(){nudgeBet(-BET_STEP);});betPlus.addEventListener("click",function(){nudgeBet(BET_STEP);});betInput.addEventListener("change",clampBetInput);if(panelEl){panelEl.addEventListener("animationend",function(){panelEl.classList.remove("jolt-67f944e2");});}
buildGrid();renderBalance();renderStats();if(state.balance<1){setStatus("Balance is empty — press reset to refill the demo wallet.","");}})();