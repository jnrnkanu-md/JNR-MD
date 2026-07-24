const settings = {
  prefix: ".", // 👈 This stays as a property inside the object
  packname: 'JNR NKANU CONCEPTS™ ',
  author: '‎',
  botName: "JNR NKANU CONCEPTS™ ",
  botOwner: 'JNR NKANU.O',
  ownerNumber: '2349137495210',
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: "public",
  maxStoreMessages: 20, 
  storeWriteInterval: 10000,
  description: "This is a bot for managing group commands and automating tasks.",
  version: "3.0.6",
  updateZipUrl: "",
};

// 👇 ADD THIS LINE HERE (Outside the curly braces)
global.prefix = settings.prefix; 

module.exports = settings;