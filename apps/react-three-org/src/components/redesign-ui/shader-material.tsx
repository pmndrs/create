import * as THREE from 'three'

export const createShaderMaterial = () => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector3(1, 1, 1) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uResolution;
        varying vec2 vUv;
        
        mat4 RotationMatrixX(float angle){
            return mat4(1.0, 0.0, 0.0, 0.0, 
                        0.0, cos(angle), -sin(angle), 0.0, 
                        0.0, sin(angle), cos(angle), 0.0,
                        0.0, 0.0, 0.0, 1.0);
        }
        
        mat4 RotationMatrixY(float angle){
            return mat4(cos(angle), 0.0, sin(angle), 0.0, 
                        0.0, 1.0, 0.0, 0.0, 
                        -sin(angle), 0.0, cos(angle), 0.0,
                        0.0, 0.0, 0.0, 1.0);
        }
        
        float sdCircle(vec2 st, vec2 pos, float radius){
           return length(st - pos) + radius; 
        }
        
        float sinTheta(float theta){
            return sin(theta * 3.14 / 180.0);
        }
        
        float cosTheta(float theta){
            return cos(theta * 3.14 / 180.0);
        }
        
        vec3 getRotation(int index){
            vec3 angle[7];
            angle[0] = vec3(1.0, 0.5, 0.0);
            angle[1] = vec3(-1.0, 0.5, 0.0);
            angle[2] = vec3(0.0, 2.0, 0.0);   
            return angle[index];
        }
        
        float getNeonCircle(float circle, float radius, float brightness){
            circle -= radius;
            circle = abs(circle);    
            return circle = brightness / circle;   
        }
        
        float random(vec2 st) {
            return fract(sin(dot(st.xy,
                                 vec2(12.9898,79.321)))*
                51758.54);
        }
        
        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
        
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
        
            vec2 u = f * f * (3.0 - 2.0 * f);
        
            return mix(a, b, u.x) +
                    (c - a)* u.y * (1.0 - u.x) +
                    (d - b) * u.x * u.y;
        }
        
        float fbm(vec2 st) {
            int octaves = 2;
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            mat2 rot = mat2(cos(0.5), sin(0.5),
                            -sin(0.5), cos(0.5));
            for (int i = 0; i < octaves; i++) {
                v += a * noise(st);
                st = rot * st * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        
        void mainImage(out vec4 fragColor, in vec2 fragCoord) {
            vec2 st = (fragCoord.xy * 2.0 - uResolution.xy) / uResolution.y; 
            vec3 finalColor = vec3(0.0);    
            
            vec2 q = vec2(0.0);
            q.x = fbm(st + 0.00*uTime);
            q.y = fbm(st + vec2(1.0));
            vec2 r = vec2(0.0);
            r.x = fbm(st + 1.0*q + vec2(1.7,9.2)+ 0.15*uTime);
            r.y = fbm(st + 1.0*q + vec2(8.3,2.8)+ 0.126*uTime);
            float f = fbm(st+r);      
            
            float signed = 1.0;
            for (float i = 0.0; i < 3.0; i++){
                vec3 col = vec3(0.0); 
                vec4 st0 = vec4(st, 0.0, 1.0);
                vec3 angle = getRotation(int(i));
                st0 *= RotationMatrixX(angle.x);
                st0 *= RotationMatrixY(angle.y);    
        
                float radius = 0.6;    
                float circle = sdCircle(st0.xy, vec2(0.0), radius);
                circle = getNeonCircle(circle, 1.0, 0.01);
              
                col +=circle;  
                float timeCoef = uTime * 2.0 + i - signed;
                float theta = 90.0 * timeCoef * signed;
                float theta2 = 90.0 * (timeCoef + 1.2) * signed;
                float cosAngle = st0.x * cosTheta(theta);
                float sinAngle = st0.y * sinTheta(theta);      
           
                col *= (cosAngle + sinAngle);
                
                finalColor = max(finalColor + col, finalColor);
                signed *= -1.0;
            }   
            
            finalColor *= vec3(1.0, 1.0, 1.0);
            fragColor = vec4(finalColor, 1.0);
        }
        
        void main() {
          vec2 fragCoord = vUv * uResolution.xy;
          vec4 fragColor;
          mainImage(fragColor, fragCoord);
          gl_FragColor = fragColor;
        }
      `,
      side: THREE.DoubleSide,
      transparent: true
    });
  };