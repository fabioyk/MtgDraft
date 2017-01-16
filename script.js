var orders = {
  CMC: 1,
  COLOR: 2,
  RARITY: 3,
  TYPE: 4
};

var currentRoundBoosters = [];
var boosterPack = [];
var draftPick = 0;
var currentBooster = 0;
var draftedCards = [];
var cardOrder = orders.CMC;

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

function orderPickedCards() {
  switch(cardOrder) {
    case orders.CMC: draftedCards.sort(orderByCmc); break;
    case orders.COLOR: draftedCards.sort(orderByColor); break;
    case orders.RARITY: draftedCards.sort(orderByRarity); break;
    case orders.TYPE: draftedCards.sort(orderByType); break;
  }
  drawPicked();
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
  orderPickedCards();
}

$(document).ready(function whenDocReady() {
  console.log("ready");
  $.ajax("KLD.json", {
    success: jsonKLDLoaded,
    error: jsonLoadFail
  });
  $(".cardsPack").on("click", ".draftImg", pickedCard);
  $(".sort").click(function () {
    if ($(this).prop("disabled")) {
      $(this).prop("disabled", false);
    } else {
      $(".sort").prop("disabled", false),
      $(this).prop("disabled", true);
      switch($(this).attr("id")) {
        case "sortCmc": cardOrder = orders.CMC; break;
        case "sortColor": cardOrder = orders.COLOR; break;
        case "sortRarity": cardOrder = orders.RARITY; break;
        case "sortType": cardOrder = orders.TYPE; break;
      }
      orderPickedCards();
    }
  });
});

function jsonKLDLoaded(json) {
  jsonKLD = json;    
  $.ajax("boosters.json", {
    success: jsonBoostersLoaded,
    error: jsonLoadFail
  });
}
  
function jsonLoadFail(jqXHR, textStatus, errorThrown) {
  console.log(jqXHR,textStatus,errorThrown);
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

function orderByCmc(a, b) {
  return (a.cmc !== undefined ? a.cmc : -1) - (b.cmc !== undefined ? b.cmc : -1);
}
function orderByColor(a, b) {
  var args = [a.colors,b.colors], res = [];
  for (var i=0; i<2; i++) {
    if (args[i] === undefined) {      
      res[i] = 0;
    } else if (args[i].length > 1) {
      res[i] = 6;
    } else switch(args[i][0]) {
      case "White": res[i] = 1; break;
      case "Blue": res[i] = 2; break;
      case "Black": res[i] = 3; break;
      case "Red": res[i] = 4; break;
      case "Green": res[i] = 5; break;
    }    
  }  
  return res[0] - res[1];  
}
function orderByRarity(a, b) {
  var args = [a.rarity,b.rarity], res=[];
  for (var i=0; i<2; i++) {
    switch(args[i]) {
      case "Common": res[i] = 0; break;
      case "Uncommon": res[i] = 1; break;
      case "Rare": res[i] = 2; break;
      case "Mythic Rare": res[i] = 3; break;
      default: res[i] = -1;
    }
  }
  return res[1] - res[0];
}
function orderByType(a, b) {
  var args=[a.types,b.types], res = [];
  for (var i=0; i<2; i++) {
    var arr = args[i];
    if (typeof args[i] === "string") {      
      arr = [args[i]];
    }
    if (arr.indexOf("Creature") !== -1) {
      res[i] = 0;
    } else if (arr.indexOf("Instant") !== -1) {
      res[i] = 1;
    } else if (arr.indexOf("Sorcery") !== -1) {
      res[i] = 2;
    } else if (arr.indexOf("Enchantment") !== -1) {
      res[i] = 3;
    } else if (arr.indexOf("Artifact") !== -1) {
      res[i] = 4;
    } else if (arr.indexOf("Land") !== -1) {
      res[i] = 7;
    } else if (arr.indexOf("Planeswalker") !== -1) {
      res[i] = 5;
    } else {
      res[i] = 6;
    }
  }
  return res[0] - res[1];
}