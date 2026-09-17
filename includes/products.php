<?php
declare(strict_types=1);

function validateProductPayload(mixed $body): array
{
    if (!is_array($body)) throw new InvalidArgumentException('invalid_fields');
    $expected=['nombre','descripcion','precio','cantidadMl','opcion','imagen','esGratis','activo','agotado','bebidaId','tipoBebida'];
    if(array_keys($body)!==$expected)throw new InvalidArgumentException('invalid_fields');
    $name=is_string($body['nombre'])?trim($body['nombre']):'';$description=is_string($body['descripcion'])?trim($body['descripcion']):'';$image=is_string($body['imagen'])?trim(str_replace('\\','/',$body['imagen'])):'';$drinkId=is_string($body['bebidaId'])?trim($body['bebidaId']):'';$drinkType=is_string($body['tipoBebida'])?trim($body['tipoBebida']):'';
    $price=filter_var($body['precio'],FILTER_VALIDATE_FLOAT);$quantity=filter_var($body['cantidadMl'],FILTER_VALIDATE_INT);$option=$body['opcion']===null?null:filter_var($body['opcion'],FILTER_VALIDATE_INT);
    foreach(['esGratis','activo','agotado'] as $key)if(!is_bool($body[$key]))throw new InvalidArgumentException('invalid_boolean');
    if(mb_strlen($name)<2||mb_strlen($name)>120||mb_strlen($description)>600||$price===false||$price<0||$price>100000||(!$body['esGratis']&&$price<=0)||$quantity===false||$quantity<1||$quantity>100000||($option!==null&&($option===false||$option<0||$option>10000))||mb_strlen($drinkType)>80||($drinkId!==''&&!preg_match('/^[A-Za-z0-9_-]{1,100}$/',$drinkId)))throw new InvalidArgumentException('invalid_product');
    if($image!==''&&!preg_match('#^assets/(?:img/)?productos/[A-Za-z0-9._-]+\.(?:png|jpe?g|webp|gif)$#i',$image))throw new InvalidArgumentException('invalid_image');
    if($image!==''){$resolved=realpath(dirname(__DIR__).'/'.$image);$root=realpath(dirname(__DIR__).'/assets');if($resolved===false||$root===false||!is_file($resolved)||!str_starts_with($resolved,$root.DIRECTORY_SEPARATOR))throw new InvalidArgumentException('invalid_image');}
    return ['nombre'=>$name,'descripcion'=>$description,'precio'=>(float)$price,'cantidadMl'=>(int)$quantity,'opcion'=>$option,'imagen'=>$image,'esGratis'=>$body['esGratis'],'activo'=>$body['activo'],'agotado'=>$body['agotado'],'bebidaId'=>$drinkId,'tipoBebida'=>$drinkType];
}
