describe('home page', () => {
  it('visit home page', () => {
    // 访问首页
    cy.visit('https://vtron.site/win');
    // 断言标题
    cy.title().should('eq', 'Vtron');
    cy.get('.notify').should('be.visible');
    cy.get('.notify').should('contain', '欢迎加入技术交流qq群 712921211');
  });
});
