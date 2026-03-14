export type LeadStatus = "Ready" | "Dialing" | "Paused" | "Done" | "Do Not Call";
export type CallStatus = "Dialing" | "Ringing" | "Voicemail" | "Live Call" | "Completed" | "Failed";
export type ResultType = "No Answer" | "Voicemail Left" | "Interested" | "Send List" | "Callback Requested" | "Meeting Requested" | "Not Interested" | "Wrong Person" | "Failed";
export type BuyerType = "Amazon Seller" | "Footwear Wholesaler" | "Apparel Trader" | "Bulk Discount Buyer";

export interface Lead {
  id: string;
  name: string;
  business: string;
  phone: string;
  buyerType: BuyerType;
  offerPacket: string;
  status: LeadStatus;
  lastResult: string;
  notes: string;
  contactEmail: string;
  preferredChannel: string;
  knownInterests: string[];
  pastOrders: { date: string; items: string; value: string }[];
  promptContext: {
    buyerContext: string;
    inventoryShortlist: string[];
    fallbackInventory: string[];
    callGoal: string;
  };
}

export interface LiveCall {
  id: string;
  leadId: string;
  leadName: string;
  business: string;
  status: CallStatus;
  duration: string;
  summary: string;
  transcript: { speaker: "AI" | "Buyer"; text: string; time: string }[];
}

export interface CallResult {
  id: string;
  timestamp: string;
  leadName: string;
  business: string;
  result: ResultType;
  interestLevel: string;
  buyerWanted: string;
  productsMentioned: string;
  followUp: string;
  nextAction: string;
  transcript: { speaker: "AI" | "Buyer"; text: string; time: string }[];
  summary: string;
  extractedOutcome: string;
  productsDiscussed: string[];
  nextStep: string;
}

export const leads: Lead[] = [
  {
    id: "L001", name: "Marcus Webb", business: "TradeKicks Ltd", phone: "+44 7911 234 001",
    buyerType: "Footwear Wholesaler", offerPacket: "Adidas Footwear", status: "Ready",
    lastResult: "No Answer", notes: "Prefers phone, buys in bulk 500+ pairs",
    contactEmail: "marcus@tradekicks.co.uk", preferredChannel: "Phone",
    knownInterests: ["Adidas Samba", "Adidas Gazelle", "Adidas Stan Smith"],
    pastOrders: [
      { date: "2025-11-15", items: "Adidas Samba x400", value: "£18,400" },
      { date: "2025-09-02", items: "Adidas Gazelle x250", value: "£11,250" },
    ],
    promptContext: {
      buyerContext: "UK-based footwear wholesaler, repeat buyer. Avg order £15k. Prefers Adidas lifestyle range. Price ceiling £48/pair.",
      inventoryShortlist: ["Adidas Samba OG — 380 pairs, sizes 6-12, £42/pair", "Adidas Gazelle Indoor — 200 pairs, sizes 7-11, £38/pair"],
      fallbackInventory: ["Adidas Stan Smith — 150 pairs, mixed sizes, £35/pair", "Adidas Ultraboost 22 — 90 pairs, £52/pair"],
      callGoal: "Pitch Samba OG excess stock. Mention Gazelle as add-on. Aim for 300+ pair commitment.",
    },
  },
  {
    id: "L002", name: "Priya Patel", business: "SoleMate Wholesale", phone: "+44 7922 345 012",
    buyerType: "Amazon Seller", offerPacket: "Mixed Apparel", status: "Ready",
    lastResult: "Send List", notes: "Needs clean invoices, Amazon FBA seller",
    contactEmail: "priya@solematewholesale.com", preferredChannel: "Email first, then phone",
    knownInterests: ["Converse Chuck Taylor", "Converse Chuck 70", "New Balance 574"],
    pastOrders: [
      { date: "2025-12-01", items: "Converse Chuck Taylor x600", value: "£21,000" },
    ],
    promptContext: {
      buyerContext: "Amazon FBA seller, needs clean invoices and brand authorization letters. Moves fast on good pricing. Volume buyer.",
      inventoryShortlist: ["Converse Chuck Taylor Hi — 500 pairs, full size run, £32/pair", "Converse Chuck 70 — 180 pairs, sizes 7-10, £45/pair"],
      fallbackInventory: ["New Balance 574 — 220 pairs, £38/pair", "Mixed Converse Low — 300 pairs, £28/pair"],
      callGoal: "Follow up on previous list request. Push Chuck Taylor volume deal. Mention Chuck 70 premium margin opportunity.",
    },
  },
  {
    id: "L003", name: "Danny Okoye", business: "NorthWear Apparel", phone: "+44 7933 456 023",
    buyerType: "Apparel Trader", offerPacket: "Mixed Apparel", status: "Dialing",
    lastResult: "Interested", notes: "Price sensitive, wants UK stock only",
    contactEmail: "danny@northwear.co.uk", preferredChannel: "WhatsApp",
    knownInterests: ["Adidas Ultraboost", "Mixed Sportswear"],
    pastOrders: [
      { date: "2025-10-20", items: "Mixed Adidas Apparel x1200 units", value: "£14,400" },
    ],
    promptContext: {
      buyerContext: "Apparel trader based in Manchester. Sells to market stalls and independent retailers. Price ceiling £12/unit on apparel.",
      inventoryShortlist: ["Adidas Training Tees x800 — £8/unit", "Adidas Track Pants x400 — £11/unit"],
      fallbackInventory: ["Mixed Sportswear Hoodies x200 — £14/unit", "Adidas Socks 3-pack x1000 — £4/pack"],
      callGoal: "Re-engage after previous interest. Offer UK-warehoused apparel lots. Emphasize quick delivery.",
    },
  },
  {
    id: "L004", name: "Sarah Chen", business: "BulkBuy Direct", phone: "+44 7944 567 034",
    buyerType: "Bulk Discount Buyer", offerPacket: "Converse Footwear", status: "Ready",
    lastResult: "Callback Requested", notes: "Prefers WhatsApp follow-up, large volume only",
    contactEmail: "sarah@bulkbuydirect.co.uk", preferredChannel: "WhatsApp",
    knownInterests: ["Converse Chuck Taylor", "Converse Chuck 70"],
    pastOrders: [
      { date: "2025-08-15", items: "Converse Chuck Taylor x800", value: "£25,600" },
      { date: "2025-06-10", items: "Converse Chuck 70 x300", value: "£13,500" },
    ],
    promptContext: {
      buyerContext: "High-volume buyer, typically 500+ pairs minimum. Exports to EU. Needs EUR invoicing option. Very price-driven.",
      inventoryShortlist: ["Converse Chuck Taylor Hi — 500 pairs, £32/pair", "Converse Chuck Taylor Lo — 400 pairs, £30/pair"],
      fallbackInventory: ["Converse Chuck 70 Hi — 180 pairs, £45/pair"],
      callGoal: "Callback follow-up. Offer combined Chuck Taylor Hi+Lo deal at volume discount. Mention EUR invoicing available.",
    },
  },
  {
    id: "L005", name: "James Thornton", business: "StepRight Trading", phone: "+44 7955 678 045",
    buyerType: "Footwear Wholesaler", offerPacket: "Adidas Footwear", status: "Ready",
    lastResult: "—", notes: "New lead, referred by Marcus Webb",
    contactEmail: "james@stepright.co.uk", preferredChannel: "Phone",
    knownInterests: ["Adidas Samba", "Adidas Stan Smith"],
    pastOrders: [],
    promptContext: {
      buyerContext: "New lead referred by existing buyer. Footwear wholesaler in Birmingham. No order history. Referral suggests interest in Adidas lifestyle.",
      inventoryShortlist: ["Adidas Samba OG — 380 pairs, £42/pair", "Adidas Stan Smith — 150 pairs, £35/pair"],
      fallbackInventory: ["Adidas Gazelle Indoor — 200 pairs, £38/pair"],
      callGoal: "Intro call. Mention referral from Marcus Webb. Gauge interest and volume capacity. Qualify as buyer.",
    },
  },
  {
    id: "L006", name: "Rachel Kim", business: "UrbanSole Co", phone: "+44 7966 789 056",
    buyerType: "Amazon Seller", offerPacket: "Adidas Footwear", status: "Paused",
    lastResult: "Not Interested", notes: "Was not interested last month, retry in 30 days",
    contactEmail: "rachel@urbansole.co.uk", preferredChannel: "Email",
    knownInterests: ["Adidas Ultraboost", "New Balance 574"],
    pastOrders: [
      { date: "2025-07-22", items: "Adidas Ultraboost x150", value: "£9,750" },
    ],
    promptContext: {
      buyerContext: "Amazon seller, previously declined. 30-day cool-off period ending soon. Interested in performance footwear.",
      inventoryShortlist: ["Adidas Ultraboost 22 — 90 pairs, £52/pair"],
      fallbackInventory: ["New Balance 574 — 220 pairs, £38/pair"],
      callGoal: "Soft re-engagement. Don't push hard. Mention new Ultraboost stock arrived since last contact.",
    },
  },
  {
    id: "L007", name: "Tom Richards", business: "KickStock UK", phone: "+44 7977 890 067",
    buyerType: "Footwear Wholesaler", offerPacket: "UK Stock Only", status: "Ready",
    lastResult: "Voicemail Left", notes: "Wants UK stock only, no imports",
    contactEmail: "tom@kickstock.co.uk", preferredChannel: "Phone",
    knownInterests: ["Adidas Samba", "Converse Chuck Taylor", "New Balance 574"],
    pastOrders: [
      { date: "2025-11-05", items: "Mixed Footwear x500 pairs", value: "£17,500" },
    ],
    promptContext: {
      buyerContext: "Strictly UK-warehoused stock. Will not accept imports or pre-orders. Quick payment terms, usually within 7 days.",
      inventoryShortlist: ["Adidas Samba OG — 380 pairs, UK warehouse, £42/pair", "Converse Chuck Taylor — 500 pairs, UK warehouse, £32/pair"],
      fallbackInventory: ["New Balance 574 — 220 pairs, UK warehouse, £38/pair"],
      callGoal: "Follow up on voicemail. Emphasize all stock is UK-warehoused and ready for immediate dispatch.",
    },
  },
  {
    id: "L008", name: "Aisha Mohammed", business: "ValueTraders Ltd", phone: "+44 7988 901 078",
    buyerType: "Bulk Discount Buyer", offerPacket: "Mixed Apparel", status: "Ready",
    lastResult: "Meeting Requested", notes: "Wants to visit warehouse, high potential",
    contactEmail: "aisha@valuetraders.co.uk", preferredChannel: "Phone",
    knownInterests: ["Mixed Sportswear", "Adidas Apparel"],
    pastOrders: [
      { date: "2025-10-10", items: "Mixed Apparel x2000 units", value: "£22,000" },
      { date: "2025-08-25", items: "Adidas Training Range x800", value: "£9,600" },
    ],
    promptContext: {
      buyerContext: "Large volume apparel buyer. Exports to Middle East markets. Previous meeting request pending. High-value account prospect.",
      inventoryShortlist: ["Adidas Training Tees x800, £8/unit", "Adidas Track Pants x400, £11/unit", "Mixed Hoodies x500, £14/unit"],
      fallbackInventory: ["Adidas Socks 3-pack x1000, £4/pack"],
      callGoal: "Confirm warehouse visit. Prepare stock viewing. Discuss potential exclusive pricing for 2000+ unit orders.",
    },
  },
  {
    id: "L009", name: "Chris Baker", business: "SneakerBox Wholesale", phone: "+44 7999 012 089",
    buyerType: "Footwear Wholesaler", offerPacket: "Adidas Footwear", status: "Done",
    lastResult: "Interested", notes: "Order confirmed, awaiting payment",
    contactEmail: "chris@sneakerbox.co.uk", preferredChannel: "Phone",
    knownInterests: ["Adidas Samba", "Adidas Gazelle"],
    pastOrders: [
      { date: "2026-01-15", items: "Adidas Samba OG x300", value: "£12,600" },
    ],
    promptContext: {
      buyerContext: "Active buyer with confirmed order in pipeline. Payment expected within 48 hours.",
      inventoryShortlist: ["Adidas Samba OG — 380 pairs, £42/pair"],
      fallbackInventory: ["Adidas Gazelle — 200 pairs, £38/pair"],
      callGoal: "Payment follow-up only. Do not pitch new stock until current order is settled.",
    },
  },
  {
    id: "L010", name: "Fatima Al-Rashid", business: "GlobeTrend Exports", phone: "+44 7800 123 090",
    buyerType: "Apparel Trader", offerPacket: "Mixed Apparel", status: "Ready",
    lastResult: "No Answer", notes: "Exports to Gulf region, needs bulk pricing",
    contactEmail: "fatima@globetrend.co.uk", preferredChannel: "WhatsApp",
    knownInterests: ["Adidas Apparel", "Mixed Sportswear"],
    pastOrders: [],
    promptContext: {
      buyerContext: "Export-focused trader, Gulf region markets. New lead, no prior orders. Interested in bulk apparel at competitive pricing.",
      inventoryShortlist: ["Adidas Training Tees x800, £8/unit", "Mixed Sportswear Hoodies x200, £14/unit"],
      fallbackInventory: ["Adidas Track Pants x400, £11/unit"],
      callGoal: "Initial qualification call. Understand volume requirements and export logistics preferences.",
    },
  },
  {
    id: "L011", name: "Liam O'Connor", business: "DealDrop Shoes", phone: "+44 7811 234 101",
    buyerType: "Amazon Seller", offerPacket: "Converse Footwear", status: "Do Not Call",
    lastResult: "Wrong Person", notes: "Do not call — wrong contact, requested removal",
    contactEmail: "liam@dealdrop.co.uk", preferredChannel: "N/A",
    knownInterests: [],
    pastOrders: [],
    promptContext: {
      buyerContext: "DO NOT CALL. Contact requested removal from call list.",
      inventoryShortlist: [],
      fallbackInventory: [],
      callGoal: "N/A — Do Not Call",
    },
  },
  {
    id: "L012", name: "Nina Volkov", business: "EastEnd Traders", phone: "+44 7822 345 112",
    buyerType: "Bulk Discount Buyer", offerPacket: "UK Stock Only", status: "Ready",
    lastResult: "—", notes: "New lead from trade show, interested in NB",
    contactEmail: "nina@eastendtraders.co.uk", preferredChannel: "Phone",
    knownInterests: ["New Balance 574", "Converse Chuck 70"],
    pastOrders: [],
    promptContext: {
      buyerContext: "Met at London trade show. Expressed interest in New Balance and Converse premium lines. Budget unknown.",
      inventoryShortlist: ["New Balance 574 — 220 pairs, £38/pair", "Converse Chuck 70 — 180 pairs, £45/pair"],
      fallbackInventory: ["Converse Chuck Taylor — 500 pairs, £32/pair"],
      callGoal: "Follow up from trade show intro. Qualify budget and volume. Send catalog if interested.",
    },
  },
  {
    id: "L013", name: "David Park", business: "FastTrack Wholesale", phone: "+44 7833 456 123",
    buyerType: "Footwear Wholesaler", offerPacket: "Adidas Footwear", status: "Ready",
    lastResult: "Send List", notes: "Sent list last week, needs follow-up",
    contactEmail: "david@fasttracksale.co.uk", preferredChannel: "Email",
    knownInterests: ["Adidas Samba", "Adidas Stan Smith", "Adidas Gazelle"],
    pastOrders: [
      { date: "2025-09-18", items: "Adidas Stan Smith x200", value: "£7,000" },
    ],
    promptContext: {
      buyerContext: "Received stock list last week. Needs nudge to place order. Previously bought Stan Smith, may want to expand to Samba.",
      inventoryShortlist: ["Adidas Samba OG — 380 pairs, £42/pair", "Adidas Stan Smith — 150 pairs, £35/pair"],
      fallbackInventory: ["Adidas Gazelle Indoor — 200 pairs, £38/pair"],
      callGoal: "Follow up on stock list sent 7 days ago. Ask if any lines interested. Push Samba as bestseller.",
    },
  },
  {
    id: "L014", name: "Sophie Turner", business: "ClearStock Co", phone: "+44 7844 567 134",
    buyerType: "Bulk Discount Buyer", offerPacket: "Mixed Apparel", status: "Dialing",
    lastResult: "Interested", notes: "Very interested in clearance lots",
    contactEmail: "sophie@clearstock.co.uk", preferredChannel: "Phone",
    knownInterests: ["Clearance Lots", "Mixed Sportswear"],
    pastOrders: [
      { date: "2025-12-20", items: "Mixed Clearance Lot x3000 units", value: "£18,000" },
    ],
    promptContext: {
      buyerContext: "Clearance specialist. Buys large mixed lots at deep discount. Not brand-specific. Cares about margin per unit.",
      inventoryShortlist: ["Mixed Clearance Lot — 2500 units, avg £6/unit", "End-of-line Adidas Apparel x800, £5/unit"],
      fallbackInventory: ["Mixed Footwear Ends — 150 pairs, £20/pair"],
      callGoal: "She expressed interest last call. Present the 2500-unit clearance lot. Aim to close on this call.",
    },
  },
  {
    id: "L015", name: "Ben Williams", business: "ProStep Distribution", phone: "+44 7855 678 145",
    buyerType: "Footwear Wholesaler", offerPacket: "Adidas Footwear", status: "Ready",
    lastResult: "No Answer", notes: "Left 2 voicemails, try morning slot",
    contactEmail: "ben@prostep.co.uk", preferredChannel: "Phone",
    knownInterests: ["Adidas Samba", "Adidas Ultraboost"],
    pastOrders: [
      { date: "2025-10-30", items: "Adidas Ultraboost x100", value: "£5,200" },
    ],
    promptContext: {
      buyerContext: "Distribution company, supplies independent retailers. Previous buyer of Ultraboost. Try calling before 10am.",
      inventoryShortlist: ["Adidas Samba OG — 380 pairs, £42/pair", "Adidas Ultraboost 22 — 90 pairs, £52/pair"],
      fallbackInventory: ["Adidas Gazelle — 200 pairs, £38/pair"],
      callGoal: "Third attempt. Try morning slot. If reached, pitch Samba as new addition alongside Ultraboost restock.",
    },
  },
];

export const liveCalls: LiveCall[] = [
  {
    id: "C001", leadId: "L003", leadName: "Danny Okoye", business: "NorthWear Apparel",
    status: "Live Call", duration: "2:34",
    summary: "Buyer asking about Adidas training tee pricing. Seems interested in 500+ units.",
    transcript: [
      { speaker: "AI", text: "Hi Danny, this is DialDesk calling from ExcessStock UK. How are you today?", time: "0:00" },
      { speaker: "Buyer", text: "Yeah not bad mate, what you got for me?", time: "0:05" },
      { speaker: "AI", text: "We've got a fresh lot of Adidas training tees just landed in our UK warehouse. 800 units available at £8 per unit. Thought of you first given your last order.", time: "0:12" },
      { speaker: "Buyer", text: "£8 each? What sizes you got?", time: "0:25" },
      { speaker: "AI", text: "Full size run, S through XXL. Good mix, about 60% in M, L, XL which are your best movers.", time: "0:30" },
      { speaker: "Buyer", text: "Right. What about the track pants you had last time? Got any more of those?", time: "0:42" },
      { speaker: "AI", text: "Yes actually, we've got 400 Adidas track pants at £11 per unit. Same quality as your last batch.", time: "0:50" },
      { speaker: "Buyer", text: "Alright, can you do a deal on both? I'd take maybe 500 tees and 300 pants if the price is right.", time: "1:05" },
      { speaker: "AI", text: "For that volume I can definitely look at a package price. Let me work something out — what's your ceiling per unit on a combined order?", time: "1:15" },
      { speaker: "Buyer", text: "I need to be under £10 average across both to make it work for my guys.", time: "1:30" },
    ],
  },
  {
    id: "C002", leadId: "L014", leadName: "Sophie Turner", business: "ClearStock Co",
    status: "Ringing", duration: "0:08",
    summary: "Outbound call initiated — follow-up on clearance lot interest.",
    transcript: [],
  },
  {
    id: "C003", leadId: "L007", leadName: "Tom Richards", business: "KickStock UK",
    status: "Voicemail", duration: "0:45",
    summary: "Went to voicemail. Left message about UK-warehoused Samba and Chuck Taylor stock.",
    transcript: [
      { speaker: "AI", text: "Hi Tom, it's DialDesk from ExcessStock UK. Just following up on my earlier message. We've got Adidas Samba — 380 pairs — and Converse Chuck Taylor — 500 pairs — both sitting in our UK warehouse ready for immediate dispatch. Give us a ring back when you get a chance. Cheers.", time: "0:00" },
    ],
  },
  {
    id: "C004", leadId: "L001", leadName: "Marcus Webb", business: "TradeKicks Ltd",
    status: "Completed", duration: "4:12",
    summary: "Good call. Marcus interested in 300 pairs of Samba OG. Wants pricing confirmation by email. Will confirm order by Friday.",
    transcript: [
      { speaker: "AI", text: "Marcus, good to catch you. I've got something I think you'll like — we just received 380 pairs of the Adidas Samba OG.", time: "0:00" },
      { speaker: "Buyer", text: "Oh nice, what sizes?", time: "0:08" },
      { speaker: "AI", text: "Full run, 6 through 12. Good distribution across the range.", time: "0:12" },
      { speaker: "Buyer", text: "What's the price?", time: "0:16" },
      { speaker: "AI", text: "£42 per pair for you, given our history.", time: "0:20" },
      { speaker: "Buyer", text: "Hmm that's a touch high. Can you do £40 on 300 pairs?", time: "0:28" },
      { speaker: "AI", text: "Let me check with the team on that. I think we can make something work for 300 pairs. Can I send you the confirmed pricing by email today?", time: "0:35" },
      { speaker: "Buyer", text: "Yeah go on then. Send it over and I'll confirm by Friday.", time: "0:45" },
    ],
  },
  {
    id: "C005", leadId: "L015", leadName: "Ben Williams", business: "ProStep Distribution",
    status: "Failed", duration: "0:00",
    summary: "Call failed — number not reachable. Retry scheduled.",
    transcript: [],
  },
];

export const callResults: CallResult[] = [
  {
    id: "R001", timestamp: "2026-03-14 09:15", leadName: "Marcus Webb", business: "TradeKicks Ltd",
    result: "Interested", interestLevel: "High", buyerWanted: "Adidas Samba OG",
    productsMentioned: "Samba OG, Gazelle", followUp: "Email pricing", nextAction: "Send quote by EOD",
    transcript: liveCalls[3].transcript, summary: liveCalls[3].summary,
    extractedOutcome: "Buyer wants 300 pairs Samba OG at £40/pair. Awaiting pricing confirmation.",
    productsDiscussed: ["Adidas Samba OG", "Adidas Gazelle Indoor"],
    nextStep: "Send email with confirmed pricing for 300x Samba OG. Follow up Friday.",
  },
  {
    id: "R002", timestamp: "2026-03-14 09:32", leadName: "Tom Richards", business: "KickStock UK",
    result: "Voicemail Left", interestLevel: "Unknown", buyerWanted: "—",
    productsMentioned: "Samba, Chuck Taylor", followUp: "Retry tomorrow AM", nextAction: "Call back tomorrow 9am",
    transcript: liveCalls[2].transcript, summary: liveCalls[2].summary,
    extractedOutcome: "Voicemail left. Mentioned Samba and Chuck Taylor availability.",
    productsDiscussed: ["Adidas Samba OG", "Converse Chuck Taylor"],
    nextStep: "Retry call tomorrow morning before 10am.",
  },
  {
    id: "R003", timestamp: "2026-03-14 09:45", leadName: "Priya Patel", business: "SoleMate Wholesale",
    result: "Send List", interestLevel: "Medium", buyerWanted: "Converse range",
    productsMentioned: "Chuck Taylor, Chuck 70, NB 574", followUp: "Send updated list", nextAction: "Email stock list today",
    transcript: [
      { speaker: "AI", text: "Hi Priya, following up on our last conversation. I've got updated stock on the Converse range.", time: "0:00" },
      { speaker: "Buyer", text: "Oh great, can you just send me the updated list? I'll review with my team.", time: "0:08" },
      { speaker: "AI", text: "Of course. I'll include the Chuck Taylor, Chuck 70, and we also have New Balance 574 now.", time: "0:15" },
      { speaker: "Buyer", text: "Perfect, send it to my email. We'll get back to you by next week.", time: "0:22" },
    ],
    summary: "Buyer requested updated stock list. Will review with team and respond next week.",
    extractedOutcome: "List request — Converse and NB range. Decision expected next week.",
    productsDiscussed: ["Converse Chuck Taylor", "Converse Chuck 70", "New Balance 574"],
    nextStep: "Send updated stock list to priya@solematewholesale.com today.",
  },
  {
    id: "R004", timestamp: "2026-03-14 10:02", leadName: "Ben Williams", business: "ProStep Distribution",
    result: "No Answer", interestLevel: "Unknown", buyerWanted: "—",
    productsMentioned: "—", followUp: "Try again tomorrow", nextAction: "Retry tomorrow 9am",
    transcript: [], summary: "No answer. Third attempt. Try morning slot.",
    extractedOutcome: "No contact made.", productsDiscussed: [],
    nextStep: "Retry call tomorrow before 10am. If no answer, send SMS.",
  },
  {
    id: "R005", timestamp: "2026-03-14 10:18", leadName: "Rachel Kim", business: "UrbanSole Co",
    result: "Not Interested", interestLevel: "Low", buyerWanted: "—",
    productsMentioned: "Ultraboost", followUp: "Cool off 30 days", nextAction: "Pause for 30 days",
    transcript: [
      { speaker: "AI", text: "Hi Rachel, it's DialDesk from ExcessStock. We've got some new Adidas Ultraboost stock in.", time: "0:00" },
      { speaker: "Buyer", text: "I appreciate the call but I'm not looking to buy right now. Maybe in a month or so.", time: "0:08" },
      { speaker: "AI", text: "No problem at all. We'll check back in with you. Thanks for your time, Rachel.", time: "0:15" },
    ],
    summary: "Buyer not interested currently. Requested callback in ~30 days.",
    extractedOutcome: "Not interested. 30-day cool-off requested.",
    productsDiscussed: ["Adidas Ultraboost"],
    nextStep: "Set 30-day cool-off. Re-engage mid-April.",
  },
  {
    id: "R006", timestamp: "2026-03-14 10:35", leadName: "Aisha Mohammed", business: "ValueTraders Ltd",
    result: "Meeting Requested", interestLevel: "High", buyerWanted: "Mixed Apparel bulk",
    productsMentioned: "Training tees, track pants, hoodies", followUp: "Schedule warehouse visit", nextAction: "Confirm visit date",
    transcript: [
      { speaker: "AI", text: "Aisha, great to connect. We discussed a warehouse visit last time — are you still keen?", time: "0:00" },
      { speaker: "Buyer", text: "Yes definitely. I want to see the apparel range in person before committing to a large order.", time: "0:06" },
      { speaker: "AI", text: "Perfect. We're available this Thursday or Friday. What works for you?", time: "0:14" },
      { speaker: "Buyer", text: "Thursday works. Say 2pm?", time: "0:20" },
      { speaker: "AI", text: "Thursday at 2pm it is. I'll send you the warehouse address and contact details by email.", time: "0:25" },
    ],
    summary: "Warehouse visit confirmed for Thursday 2pm. High-value prospect, potential 2000+ unit order.",
    extractedOutcome: "Meeting confirmed — warehouse visit Thursday 2pm.",
    productsDiscussed: ["Adidas Training Tees", "Adidas Track Pants", "Mixed Hoodies"],
    nextStep: "Send warehouse address and confirmation email. Prepare stock viewing.",
  },
  {
    id: "R007", timestamp: "2026-03-14 10:52", leadName: "Liam O'Connor", business: "DealDrop Shoes",
    result: "Wrong Person", interestLevel: "N/A", buyerWanted: "—",
    productsMentioned: "—", followUp: "Remove from list", nextAction: "Mark Do Not Call",
    transcript: [
      { speaker: "AI", text: "Hi, is this Liam from DealDrop Shoes?", time: "0:00" },
      { speaker: "Buyer", text: "No mate, wrong number. There's no Liam here.", time: "0:05" },
      { speaker: "AI", text: "Apologies for the disturbance. I'll remove this number from our list. Have a good day.", time: "0:10" },
    ],
    summary: "Wrong number. Contact requested removal.",
    extractedOutcome: "Wrong person — number invalid for this contact.",
    productsDiscussed: [],
    nextStep: "Mark as Do Not Call. Remove number from lead record.",
  },
  {
    id: "R008", timestamp: "2026-03-14 11:08", leadName: "David Park", business: "FastTrack Wholesale",
    result: "Send List", interestLevel: "Medium", buyerWanted: "Adidas Samba, Stan Smith",
    productsMentioned: "Samba, Stan Smith, Gazelle", followUp: "Follow up in 3 days", nextAction: "Send list, call Thursday",
    transcript: [
      { speaker: "AI", text: "David, following up on the stock list we sent last week. Had a chance to look through it?", time: "0:00" },
      { speaker: "Buyer", text: "Yeah I had a look. The Samba pricing is interesting. Can you resend with the Stan Smith included?", time: "0:08" },
      { speaker: "AI", text: "Absolutely. I'll include the Samba OG, Stan Smith, and I'll throw in the Gazelle pricing too.", time: "0:16" },
      { speaker: "Buyer", text: "Yeah go on. Send it today and I'll try to get back to you by Thursday.", time: "0:24" },
    ],
    summary: "Buyer reviewed list, wants updated version with Stan Smith. Expects to respond by Thursday.",
    extractedOutcome: "Re-send list with Samba, Stan Smith, and Gazelle. Decision by Thursday.",
    productsDiscussed: ["Adidas Samba OG", "Adidas Stan Smith", "Adidas Gazelle Indoor"],
    nextStep: "Send updated list today. Follow up Thursday.",
  },
  {
    id: "R009", timestamp: "2026-03-14 11:25", leadName: "Sarah Chen", business: "BulkBuy Direct",
    result: "Callback Requested", interestLevel: "Medium", buyerWanted: "Converse bulk deal",
    productsMentioned: "Chuck Taylor Hi, Chuck Taylor Lo", followUp: "Call back 3pm today", nextAction: "Retry at 3pm",
    transcript: [
      { speaker: "AI", text: "Hi Sarah, calling about the Converse deal we discussed.", time: "0:00" },
      { speaker: "Buyer", text: "Hey, I'm in a meeting right now. Can you call me back at 3?", time: "0:05" },
      { speaker: "AI", text: "Of course, I'll call you at 3pm. Talk then.", time: "0:10" },
    ],
    summary: "Buyer busy, requested callback at 3pm today.",
    extractedOutcome: "Callback requested — 3pm today.",
    productsDiscussed: ["Converse Chuck Taylor Hi", "Converse Chuck Taylor Lo"],
    nextStep: "Call back at 3pm today. Have Chuck Taylor pricing ready.",
  },
  {
    id: "R010", timestamp: "2026-03-14 11:40", leadName: "Nina Volkov", business: "EastEnd Traders",
    result: "Interested", interestLevel: "High", buyerWanted: "NB 574, Converse Chuck 70",
    productsMentioned: "NB 574, Chuck 70, Chuck Taylor", followUp: "Send samples info", nextAction: "Email sample availability",
    transcript: [
      { speaker: "AI", text: "Nina, great to speak to you. We met at the London trade show — I'm following up on your interest in New Balance and Converse.", time: "0:00" },
      { speaker: "Buyer", text: "Yes I remember. What have you got in the NB 574?", time: "0:08" },
      { speaker: "AI", text: "220 pairs, full size run, £38 per pair. All UK warehoused.", time: "0:14" },
      { speaker: "Buyer", text: "That's decent. And the Chuck 70?", time: "0:20" },
      { speaker: "AI", text: "180 pairs at £45. Premium line, good margin on those.", time: "0:25" },
      { speaker: "Buyer", text: "Can I get samples before committing? Maybe 2-3 pairs of each to check quality?", time: "0:32" },
      { speaker: "AI", text: "Absolutely, I can arrange samples. I'll email you the details today.", time: "0:38" },
    ],
    summary: "Strong interest in NB 574 and Chuck 70. Wants samples before committing to bulk order.",
    extractedOutcome: "Interested — wants samples of NB 574 and Chuck 70 before bulk order.",
    productsDiscussed: ["New Balance 574", "Converse Chuck 70"],
    nextStep: "Send sample availability email today. Follow up after samples received.",
  },
  {
    id: "R011", timestamp: "2026-03-14 11:55", leadName: "Fatima Al-Rashid", business: "GlobeTrend Exports",
    result: "No Answer", interestLevel: "Unknown", buyerWanted: "—",
    productsMentioned: "—", followUp: "Try WhatsApp", nextAction: "Send WhatsApp message",
    transcript: [], summary: "No answer on phone. Lead prefers WhatsApp — try messaging.",
    extractedOutcome: "No contact made.", productsDiscussed: [],
    nextStep: "Send WhatsApp intro message with stock highlights.",
  },
  {
    id: "R012", timestamp: "2026-03-14 12:10", leadName: "Sophie Turner", business: "ClearStock Co",
    result: "Interested", interestLevel: "High", buyerWanted: "Clearance lot 2500 units",
    productsMentioned: "Mixed clearance, Adidas end-of-line", followUp: "Send invoice", nextAction: "Prepare proforma invoice",
    transcript: [
      { speaker: "AI", text: "Sophie, I've got that 2500-unit clearance lot ready for you. Shall we go through the details?", time: "0:00" },
      { speaker: "Buyer", text: "Yeah go on then. What's the breakdown?", time: "0:06" },
      { speaker: "AI", text: "It's a mix of end-of-line Adidas apparel and mixed sportswear. Average £6 per unit. Total comes to £15,000.", time: "0:12" },
      { speaker: "Buyer", text: "Can you do £5.50 per unit? That would put it at £13,750.", time: "0:22" },
      { speaker: "AI", text: "For the full 2500 units, I can do £5.75 — that's £14,375. Best I can offer.", time: "0:30" },
      { speaker: "Buyer", text: "Alright, deal. Send me the proforma.", time: "0:38" },
    ],
    summary: "Deal closed on 2500-unit clearance lot at £5.75/unit (£14,375). Proforma invoice needed.",
    extractedOutcome: "DEAL CLOSED — 2500 units at £5.75/unit. Total £14,375.",
    productsDiscussed: ["Mixed Clearance Lot", "End-of-line Adidas Apparel"],
    nextStep: "Send proforma invoice to sophie@clearstock.co.uk immediately.",
  },
];
