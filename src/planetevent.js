import * as canvas from './canvas.js';
import * as gameobjects from './gameobjects.js';
import * as gfx from './gfx.js';
import * as scene from './scene.js';
import bus from './bus.js';
import StartButton from './startbutton.js';
import Text from './text.js';
import PlayedCard from './playedcard.js';
import cards from './cards.js';
import persist from './persist.js';

export default function PlanetEvent() {
  // Planet label
  gameobjects.add(new Text('Planet: Tenadu', ()=>canvas.width()*0.03, ()=>canvas.width()*0.05, '#fff', 0.5, 'left'));

  // Start button
  gameobjects.add(new StartButton());
  bus.on('start', () => scene.transition(2));

  // Handlers
  onTapCard = ({x, y}) => {
    var w = canvas.width();
    var h = canvas.height();
    var m = persist.getMinerals();
    var cs = Math.min(h*0.2, w*0.25);
    for (let i = 0; i < items.length; i++) {
      var bx = w/2 + (i - (items.length - 1)/2) * w * 0.3;
      if (items[i] != null && m >= items[i].price) {
        if (x > bx-cs/2 && x < bx+cs/2 && y > h*0.4-cs*3/4 && y < h*0.4+cs*3/4) {
          gameobjects.add(new PlayedCard(bx, h*0.4, items[i], cs));
          persist.addMineral(-items[i].price);
          // Templar does not add cards to deck
          if (evtType == 4) {
            items[i].use();
          } else {
            // All other shops add cards to deck
            persist.addToDeck(items[i]);
          }
          items[i] = null;
        }
      }
    }
  };

  // Event types
  var evtType = parseInt(Math.random() * 5);
  // TBD: Prevent increasing blessings to comical scales?
  var items = [];
  var merchantName = '';
  var merchantGfx = gfx.drawCharWeaponTech;

  // [EVT == 0] WEAPON TECH
  if (evtType == 0) {
    // weapon cards
    merchantName = 'Weapon Tech';
    merchantGfx = gfx.drawCharWeaponTech;
    var selection = [cards[3], cards[4], cards[5], cards[6], cards[7]];
    var numCardsInShop = parseInt(Math.random() * 2) + 2;
    for (let i = 0; i < numCardsInShop; i++) {
      items.push(selection[parseInt(Math.random() * selection.length)]);
    }
    bus.on('tap', onTapCard);
  }

  // [EVT == 1] SHIP MECHANIC
  if (evtType == 1) {
    // ship upgrade cards
    merchantName = 'Ship Mechanic';
    merchantGfx = gfx.drawCharShipMech;
    var selection = [cards[8], cards[9], cards[10], cards[11], cards[12]];
    var numCardsInShop = parseInt(Math.random() * 2) + 2;
    for (let i = 0; i < numCardsInShop; i++) {
      items.push(selection[parseInt(Math.random() * selection.length)]);
    }
    bus.on('tap', onTapCard);
  }

  // [EVT == 2] Street MERCHANT
  if (evtType == 2) {
    // mix of low tech card
    merchantName = 'Street Merchant';
    merchantGfx = gfx.drawCharMerchant;
    var selection = [cards[3], cards[4], cards[8], cards[9]];
    var numCardsInShop = parseInt(Math.random() * 2) + 2;
    for (let i = 0; i < numCardsInShop; i++) {
      items.push(selection[parseInt(Math.random() * selection.length)]);
    }
    bus.on('tap', onTapCard);
  }

  // [EVT == 3] BLACK MARKET
  if (evtType == 3) {
    // mix of high tech card
    merchantName = 'Cytox Smuggler';
    merchantGfx = gfx.drawCharSmuggler;
    var selection = [cards[5], cards[6], cards[10], cards[11]];
    var numCardsInShop = parseInt(Math.random() * 2) + 2;
    for (let i = 0; i < numCardsInShop; i++) {
      items.push(selection[parseInt(Math.random() * selection.length)]);
    }
    bus.on('tap', onTapCard);
  }

  // [EVT == 4] BLACK MARKET
  if (evtType == 4) {
    // grant max energy, max shield, hand size
    merchantName = 'Neuro-Templar';
    merchantGfx = gfx.drawCharTemplar;
    var selection = [cards[13], cards[14], cards[15]];
    for (let i = 0; i < 2; i++) {
      var opt = parseInt(Math.random() * selection.length);
      items.push(selection[opt]);
      selection.splice(opt,1);
    }
    bus.on('tap', onTapCard);
  }

  this.drawCost = (ctx, txt, x, y, s, canAfford) => {
    ctx.fillStyle='#f3f';
    ctx.font=`${s*0.25}px monospace`;
    ctx.textAlign='left';
    ctx.textBaseline='middle';
    var tw = ctx.measureText(txt).width;
    var mw = s*0.061;
    var cx = (tw + mw*2)/2;
    ctx.fillText(txt, x+mw*3-cx, y+s);
    gfx.drawMineral(ctx,x+mw/2-cx,y+s,0.785,s*0.08);
    // Cross-out price line
    if (!canAfford) {
      ctx.save();
      ctx.fillStyle='rgba(255,0,0,0.7)';
      ctx.translate(x,y+s);
      ctx.rotate(0.1);
      ctx.fillRect(-s*0.5,-1,s,3);
      ctx.rotate(-0.2);
      ctx.fillRect(-s*0.5,-1,s,3);
      ctx.restore();
    }
  }

  this.render = (ctx) => {
    var w = canvas.width();
    var h = canvas.height();
    var m = persist.getMinerals();
    var hs = persist.getHandSize();
    var me = persist.getMaxEnergy();
    var ms = persist.getMaxShield();

    // Show characters
    gfx.drawCharPlayer(ctx);
    merchantGfx(ctx);
    gfx.drawDialogBox(ctx,
      merchantName,
      'Stop staring human! Either buy something or leave.'
    );

    // Show stats
    var us = Math.min(h*0.04,w*0.04);
    ctx.textAlign='left';
    ctx.textBaseline='middle';
    ctx.font=`${us}px monospace`;
    // Mineral stats
    gfx.drawMineral(ctx, us, h*0.75, 0.785, us*0.3);
    ctx.fillStyle='#f3f';
    ctx.fillText(m, us*1.7,h*0.75);
    // Hand stats
    gfx.drawDeck(ctx, us, h*0.75-us, us*0.2);
    ctx.fillStyle='#999';
    ctx.fillText(hs, us*1.7,h*0.75-us);
    // Shield stats
    gfx.drawShield(ctx, us, h*0.75-us*2, us*0.4, true);
    ctx.fillStyle='#3ff';
    ctx.fillText(ms, us*1.7,h*0.75-us*2);
    // Energy stats
    gfx.drawEnergy(ctx, us-us*0.325, h*0.75-us*3.45, us*0.8, true);
    ctx.fillStyle='#ff3';
    ctx.fillText(me, us*1.7,h*0.75-us*3);

    // Show items for interaction
    var cs = Math.min(h*0.2, w*0.25);
    for (let i = 0; i < items.length; i++) {
      if (items[i] != null) {
        var bx = w/2 + (i - (items.length - 1)/2) * w * 0.3;
        gfx.drawCard(ctx, bx, h*0.4, cs, items[i], false,1);
        this.drawCost(ctx, `${items[i].price}`, bx, h*0.4, cs, m >= items[i].price);
      }
    }
  }
};