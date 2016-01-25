uniform int	step;

varying vec3	normal;
varying vec3	light;

const	vec4	c0 = vec4( 0.1, 0.2, 0.5, 1.0 );
const	vec4	c1 = vec4( 0.9, 0.7, 0.5, 1.0 );

void main()
{
	float	i = max( dot( normalize( normal ), light ), 0.0 );
	float	s = float( step );
	i = floor( i * s ) / s + 0.1;
	vec4	color = mix( c0, c1, i );

	gl_FragColor = color;
}
