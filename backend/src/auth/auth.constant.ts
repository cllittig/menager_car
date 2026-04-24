
export const jwtConstants = {
  secret: (() => {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET obrigatório e com no mínimo 32 caracteres');
    }
    return secret;
  })(),
};
