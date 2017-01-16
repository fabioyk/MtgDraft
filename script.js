var currentRoundBoosters = [];
var boosterPack = [];
var draftPick = 0;
var currentBooster = 0;
var draftedCards = [];

/*

var jq = document.createElement("script");
jq.src = "http://code.jquery.com/jquery-3.1.1.min.js";
document.querySelector("head").appendChild(jq);
jq.addEventListener("load", function() {
var str = ""; $(".cardlink").each(function() { str += ", \""+this.firstChild.alt+"\"" }); console.log(str);});

*/
var jsonKLD, jsonBoosters;

function setupDraft() {
  var boosterPool = jsonBoosters.pack1;
  boosterPool.sort(function() {
    return Math.random()-0.5;
  });
  currentRoundBoosters = boosterPool;
  drawPack();
}

function drawPack() {
  boosterPack = createPack(currentRoundBoosters[draftPick%8]);
  var packToDraw = boosterPack.slice();
  orderPackToDraw(packToDraw);
  $(".cardsPack").html("");
  packToDraw.forEach(function(card) {
    $(".cardsPack").append("<img class=\"draftImg\"  src=\"http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid="+card.multiverseid+"&type=card\" alt=\""+card.name+"\">");
  });
}

function drawPicked() {
  $(".draftPool").html("");
  draftedCards.forEach(function(card) {
    $(".draftPool").append("<img  src=\"http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid="+card.multiverseid+"&type=card\" alt=\""+card.name+"\">");
  });
}

function orderPackToDraw(pack) {
  pack.sort(function(a,b) {
    switch(a.rarity) {
      case "Mythic Rare": return -1;
      case "Rare": return (b.rarity != "Mythic Rare" ? -1 : 1);
      case "Uncommon": return (b.rarity != "Mythic Rare" && b.rarity != "Rare" ? -1 : 1);
      case "Common": return 1;
      default: return 0;
    }
  });
  return pack;
}

function pickedCard(event) {
  var pickedCardName = $(this).attr("alt");
  
  draftedCards.push(boosterPack.find(function(c) {
    return c.name === pickedCardName;
  }));
  
  draftPick++;
  console.log("Draft pick "+draftPick+": "+pickedCardName);
  console.log("Current picks: "+draftedCards);
  
  drawPack();
  drawPicked();
}

$(document).ready(function whenDocReady() {
  console.log("ready");
  $.ajax("/json/KLD.json", {
    success: jsonKLDLoaded
  });
  $(".cardsPack").on("click", ".draftImg", pickedCard);
});

function jsonKLDLoaded(json) {
  jsonKLD = json;    
  $.ajax("/json/boosters.json", {
    success: jsonBoostersLoaded
  });
}

function jsonBoostersLoaded(json) {
  jsonBoosters = json;
  jsonAllLoaded();
}

function jsonAllLoaded() {
  setupDraft();
}

function createPack(cardsInBooster) {
  var boosterPack = [];
  var booster = cardsInBooster.slice();
  
  var cuts = 0;
  if (draftPick >= 8) {
    if (booster.indexOf(draftedCards[draftPick-8].name) >= draftPick) {
      booster.splice(booster.indexOf(draftedCards[draftPick-8].name), 1);
      cuts = 1;
      
    }
  }
  while (cuts < draftPick) {
    booster.shift();
    cuts++;
  }  
  
  for (i = 0; i<booster.length; i++) {
    boosterPack.push(fetchCard(booster[i]));
  }
  console.log("Booster pack created!");
  console.log(boosterPack);
  return boosterPack;
}

function fetchCard(name) {
  var jsonCard = jsonKLD.cards.find(function(e) {
    return e.name === name;
  })
  if (jsonCard) {
    var card = {
      name: name,
      cmc: jsonCard.cmc,
      colors: jsonCard.colors,
      rarity: jsonCard.rarity,
      types: jsonCard.types,
      multiverseid: jsonCard.multiverseid      
    };
    return card;
  } else {
    console.log("!!! Failed to fetch "+name);
  }  
}