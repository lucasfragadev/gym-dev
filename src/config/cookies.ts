export const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  path: '/',
  // Em desenvolvimento, permitir acesso de qualquer domínio da rede local
  domain: process.env.NODE_ENV === 'development' ? undefined : process.env.COOKIE_DOMAIN,
};