export type KeepAliveConfig = typeof keepAliveConfig;

export const keepAliveConfig = {
  // Select a table in your Supabase database to make a call to
  // 我可以专门创建一个表来做这个保活功能，那么这个表就叫做keep-alive吧
  table: "keep-alive",

  // Column that will be queried with a random string？这里是什么意思？
  // 这里的意思是我们可以使用一个随机字符串来查询keep-alive表中的name字段
  // 按照README.MD文档里面的例子即可，所以keep-alive表里面会有一个name字段，然后这个字段会被查询
  column: "name",

  // Configuration for actions taken on the database
  // 是否允许插入和删除操作
  // allowInsertionAndDeletion: 如果你创建了一个专门用来做保活功能的表，那么就可以设置为true,这里设置为true的话，那么就代表会对keep-alive表进行插入和删除操作
  allowInsertionAndDeletion: true, // Set this to false unless you're using a 'keep-alive'-dedicated table
  // 如果allowInsertionAndDeletion设置为true，那么就需要设置disableRandomStringQuery为true，防止查询随机字符串
  disableRandomStringQuery: true, // Set this to true if allowInsertionAndDeletion is true. Otherwise, no db actions taken
  sizeBeforeDeletions: 50, // Max size of table before any deletions start (if allowInsertionAndDeletion is true)

  consoleLogOnError: true, // Whether to log errors to console

  // 这里的otherEndpoints是一个数组，里面包含了其他需要被保活的端点URL
  // 如果我只有一个Next.js项目需要保活，那么这个数组可以为空
  //
  otherEndpoints: [
    // "https://your-other-vercel-project-urls.vercel.app/api/keep-alive",
    // "https://your-other-supabase-app.com/api/keep-alive",
  ],
};
