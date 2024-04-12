describe('home page', () => {
  it('visit home page', () => {
    // 访问首页
    cy.visit('/');
    // 断言标题
    cy.title().should('eq', 'Vtron');
  });
});
