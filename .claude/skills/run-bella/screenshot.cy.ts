describe('smoke screenshot', () => {
  it('loads the home page and screenshots it', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
    cy.screenshot('home', { capture: 'viewport' });
  });
});
