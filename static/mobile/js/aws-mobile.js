var AWS = 
{
	//全局loading
	loading: function (s) 
	{
		if ($('#aw-loading').length == 0)
	    {
	        $('#aw-ajax-box').append('<div id="aw-loading" class="hide"><div id="aw-loading-box"></div></div>');
	    }
	    
		if (s == 'show')
		{
			if ($('#aw-loading').css('display') == 'block')
		    {
			    return false;
		    }
			
			$('#aw-loading').fadeIn();
		
			AWS.G.loading_timer = setInterval(function ()
			{
				AWS.G.loading_bg_count = AWS.G.loading_bg_count - 1;
				
				$('#aw-loading-box').css('background-position', '0px ' + AWS.G.loading_bg_count * 40 + 'px');
				
				if (AWS.G.loading_bg_count == 1)
				{
					AWS.G.loading_bg_count = 12;
				}
			}, 100);
		}
		else
		{
			$('#aw-loading').fadeOut();
		
			clearInterval(AWS.G.loading_timer);
		}
	},

	dialog: function (type , data)
	{
		var template;
		
		switch (type)
		{
			case 'publish' : 
				template = Hogan.compile(AW_MOBILE_TEMPLATE.publish).render({
		            'category_id': data.category_id,
		            'ask_user_id': data.ask_user_id
		        });
			break;

			case 'redirect' : 
				template = Hogan.compile(AW_MOBILE_TEMPLATE.redirect).render({
					'data-id' : data
				});
			break;

			case 'message' :
				template = Hogan.compile(AW_MOBILE_TEMPLATE.message).render({
					'data-name' : data
				});
			break;

			case 'commentEdit':
		        var template = Hogan.compile(AW_MOBILE_TEMPLATE.editCommentBox).render(
		        {
		            'answer_id': data.answer_id,
		            'attach_access_key': data.attach_access_key
		        });
		        break;
		}
		if (template)
		{
			$('#aw-ajax-box').empty().append(template);
			
			switch (type)
			{
				case 'message' :
					AWS.Dropdown.bind_dropdown_list('.aw-message-input','message');
				break;
				
				case 'redirect' : 
					AWS.Dropdown.bind_dropdown_list('.aw-redirect-input','redirect');
				break;

				case 'publish' :
					if (parseInt(data.category_enable) == 1)
		        	{
			        	$.get(G_BASE_URL + '/publish/ajax/fetch_question_category/', function (result)
			            {
			                AWS.Dropdown.set_dropdown_list('.alert-publish .aw-publish-dropdown', eval(result), data.category_id);

			                $('.alert-publish .aw-publish-dropdown li a').click(function ()
			                {
			                    $('#quick_publish_category_id').val($(this).attr('data-value'));
			                });
			            });
			            
			            $('#quick_publish_topic_chooser').hide();
		        	}
		        	else
		        	{
			        	$('#quick_publish_category_chooser').hide();
		        	}
		
		            if ($('#aw-search-query').val() && $('#aw-search-query').val() != $('#aw-search-query').attr('placeholder'))
		            {
			            $('#quick_publish_question_content').val($('#aw-search-query').val());
		            }
		            
		            AWS.Init.init_topic_edit_box('.alert-publish .aw-topic-edit-box .aw-add-topic-box', 'publish');
					
		            $('#quick_publish .aw-add-topic-box').click();
		            
		            if (typeof(G_QUICK_PUBLISH_HUMAN_VALID) != 'undefined')
		            {
			            $('#quick_publish_captcha').show();
			            $('#captcha').click();
		            }
				break;

				case 'commentEdit':
		            $.get(G_BASE_URL + '/question/ajax/fetch_answer_data/' + data.answer_id, function (result)
		            {
		                $('#editor_reply').html(result.answer_content.replace('&amp;', '&'));
		            }, 'json');
					
		            AWS.Init.init_fileuploader('file_uploader_answer_edit', G_BASE_URL + '/publish/ajax/attach_upload/id-answer__attach_access_key-' + ATTACH_ACCESS_KEY);
		            
		            if ($("#file_uploader_answer_edit ._ajax_upload-list").length) {
			            $.post(G_BASE_URL + '/publish/ajax/answer_attach_edit_list/', 'answer_id=' + data.answer_id, function (data) {
			                if (data['err']) {
			                    return false;
			                } else {
			                    $.each(data['rsm']['attachs'], function (i, v) {
			                        _ajax_uploader_append_file('#file_uploader_answer_edit ._ajax_upload-list', v);
			                    });
			                }
			            }, 'json');
			        }
		            break;
			}
		}
		
		$('.alert-' + type).modal('show');
	},

	load_list_view: function(url, selector, container, start_page, callback)
	{
		if (!selector.attr('id'))
	    {
	        return false;
	    }

	    if (!start_page)
	    {
	        start_page = 0
	    }

	    // 把页数绑定在元素上面
	    if (selector.attr('data-page') == undefined)
		{
			selector.attr('data-page', start_page);
		}
		else
		{
			selector.attr('data-page', parents(selector.attr('data-page')) + 1);
		}
	    
	    selector.bind('click', function ()
	    {
	    	var _this = this;

	    	$(this).addClass('loading');

	    	$.get(url + '__page-' + $(_this).attr('data-page'), function (result)
	    	{
	    		$(_this).removeClass('loading');

	    		if ($.trim(result) != '')
	    		{
	    			if ($(_this).attr('data-page') == start_page && $(_this).attr('auto-load') != 'false')
	                {
	                    container.html(result);
	                }
	                else
	                {
	                    container.append(result);
	                }

	                // 页数增加1
	                $(_this).attr('data-page', parseInt($(_this).attr('data-page')) + 1);
	    		}
	    		else
	    		{
	    			//没有内容
	    			if ($(_this).attr('data-page') == start_page && $(_this).attr('auto-load') != 'false')
	                {
	                    container.html('<p style="padding: 15px 0" align="center">' + _t('没有内容') + '</p>');
	                }

	                $(_this).addClass('disabled').unbind('click').bind('click', function () { return false; });

	                $(_this).find('span').html(_t('没有更多了'));
	    		}

	            if (callback != null)
	            {
	                callback();
	            }
	    	});

	    	return false;
	    });

	    // 自动加载
	    if (selector.attr('auto-load') != 'false')
	    {
	        selector.click();
	    }
	},

	ajax_post: function (formEl, processer, type)	// 表单对象，用 jQuery 获取，回调函数名
	{	
		if (typeof(processer) != 'function')
		{
			processer = AWS.ajax_processer;
			
			AWS.loading('show');
		}

		if (!type)
	    {
	    	var type = 'default';
	    }
		
		var custom_data = {
			_post_type:'ajax',
			_is_mobile:'true'
		};
		
		formEl.ajaxSubmit({
			dataType: 'json',
			data: custom_data,
			success: function (result)
	        {
	        	processer(type, result);
	        },
			error:	function (error) { if ($.trim(error.responseText) != '') { $.loading('hide'); alert(_t('发生错误, 返回的信息:') + ' ' + error.responseText); } }
		});
	},

	ajax_processer: function (type, result)
	{
		if (type == 'default')
		{
			AWS.loading('hide');
		}
		if (typeof (result.errno) == 'undefined')
		{
			alert(result);
		}
		else if (result.errno != 1)
		{
			if (type == 'quick_publish')
			{
				$('#quick_publish_error em').html(result.err);
	        	$('#quick_publish_error').fadeIn();
			}
			else
			{
				alert(result.err);
			}
		}
		else
		{
			if (type == 'comments_form')
			{
				AWS.reload_comments_list(result.rsm.item_id, result.rsm.item_id, result.rsm.type_name);
	        	$('#aw-comment-box-' + result.rsm.type_name + '-' + result.rsm.item_id + ' form input').val('');
	        	$('#aw-comment-box-' + result.rsm.type_name + '-' + result.rsm.item_id + ' form textarea').val('');
			}

			if (result.rsm && result.rsm.url)
	        {
	            window.location = decodeURIComponent(result.rsm.url);
	        }
	        else
	        {
	        	switch (type)
	        	{
	        		case 'default':
					case 'ajax_post_alert':
					case 'error_message':
						window.location.reload();
					break;
	        	}
	        }
		}
	},

	ajax_request: function(url, params)
	{
		AWS.loading('show');
		
	    if (params)
	    {
	        $.post(url, params + '&_post_type=ajax', function (result)
	        {
	        	_callback(result);
	        }, 'json').error(function (error)
	        {
	        	_error(error);
	        });
	    }
	    else
	    {
	        $.get(url, function (result)
	        {
	        	_callback(result);
	        }, 'json').error(function (error)
	        {
	        	_error(error);
	        });
	    }

	    function _callback (result)
	    {
	    	AWS.loading('hide');
	        	
        	if (!result)
        	{
	        	return false;
        	}
        	
            if (result.err)
            {
                AWS.alert(result.err);
            }
            else if (result.rsm && result.rsm.url)
            {
                window.location = decodeURIComponent(result.rsm.url);
            }
            else
            {
                window.location.reload();
            }
	    }

	    function _error (error)
	    {
	    	AWS.loading('hide');
	        	
            if ($.trim(error.responseText) != '')
            {
                alert(_t('发生错误, 返回的信息:') + ' ' + error.responseText);
            }
	    }

	    return false;
	},

	// 重新加载评论列表
	reload_comments_list: function (item_id, element_id, type_name)
	{
	    $('#aw-comment-box-' + type_name + '-' + element_id + ' .aw-comment-list').html('<p align="center" class="aw-padding10"><i class="aw-loading"></i></p>');

	    $.get(G_BASE_URL + '/question/ajax/get_' + type_name + '_comments/' + type_name + '_id-' + item_id + '__template-m', function (data)
	    {
	        $('#aw-comment-box-' + type_name + '-' + element_id + ' .aw-comment-list').html(data);
	    });
	}
}

// 全局变量
AWS.G = 
{
	loading_timer: '',
	loading_bg_count: 12,
	aw_dropdown_list_interval: '',
	aw_dropdown_list_flag: 0
}

AWS.User = 
{
	// 邀请用户回答问题
	invite_user: function(selector, img)
	{
		$.post(G_BASE_URL + '/question/ajax/save_invite/',
	    {
	        'question_id': QUESTION_ID,
	        'uid': selector.attr('data-id')
	    }, function (result)
	    {
	    	if (result.errno != -1)
	    	{
	    		if (selector.parents('.aw-invite-box').find('.invite-list a').length == 0)
	            {
	                selector.parents('.aw-invite-box').find('.invite-list').show();
	            }
	            selector.parents('.aw-invite-box').find('.invite-list').append(' <a class="aw-text-color-999 invite-list-user" data-toggle="tooltip" data-placement="right" data-original-title="'+ selector.attr('data-value') +'"><img src='+ img +' /></a>');
	            selector.removeClass('btn-primary').attr('onclick','disinvite_user($(this))').text('取消邀请');
	            selector.parents('.aw-question-detail-title').find('.aw-invite-replay .badge').text(parseInt(selector.parents('.aw-question-detail-title').find('.aw-invite-replay .badge').text()) + 1);
	    	}
	    	else if (result.errno == -1)
	        {
	            AWS.alert(result.err);
	        }
	    }, 'json');
	},

	// 取消邀请用户回答问题
	disinvite_user: function (selector)
	{
	    $.get(G_BASE_URL + '/question/ajax/cancel_question_invite/question_id-' + QUESTION_ID + "__recipients_uid-" + selector.attr('data-id'), function (result)
		{
			if (result.errno != -1)
	        {
	            $.each($('.aw-question-detail-title .invite-list a'), function (i, e)
	            {
	                if ($(this).attr('data-original-title') == selector.parents('.main').find('.aw-user-name').text())
	                {
	                    $(this).detach();
	                }
	            });
	            selector.addClass('btn-primary').attr('onclick','invite_user($(this),$(this).parents(\'li\').find(\'img\').attr(\'src\'))').text('邀请');
	            selector.parents('.aw-question-detail-title').find('.aw-invite-replay .badge').text(parseInt(selector.parents('.aw-question-detail-title').find('.aw-invite-replay .badge').text()) - 1);
	            if (selector.parents('.aw-invite-box').find('.invite-list').children().length == 0)
	            {
	                selector.parents('.aw-invite-box').find('.invite-list').hide();
	            }
	        }
		});
	},

	// 关注
	follow: function(selector, type, data_id)
	{
		AWS.loading('show');

		if (!selector.hasClass('active'))
        {
            selector.html(_t('取消关注'));
        }
        else
        {
            selector.html(_t('关注'));
        }

	    switch (type)
	    {
	    	case 'question':
	    		var url = '/question/ajax/focus/question_id-';
	    		break;

	    	case 'topic':
	    		var url = '/topic/ajax/focus_topic/topic_id-';
	    		break;

	    	case 'user':
	    		var url = '/follow/ajax/follow_people/uid-';
	    	break;
	    }

	    $.get(G_BASE_URL + url + data_id, function (result)
	    {
	    	AWS.loading('hide');
	    	
	    	if (result.errno == 1)
	        {
	            if (result.rsm.type == 'add')
	            {
	                selector.addClass('active');
	            }
	            else
	            {
	            	selector.removeClass('active');
	            }
	        }
	        else
	        {
	            if (result.err)
	            {
	                AWS.alert(result.err);
	            }

	            if (result.rsm.url)
	            {
	                window.location = decodeURIComponent(result.rsm.url);
	            }
	        }

	        selector.removeClass('disabled');
	        
	    }, 'json');
	},

	// 提交评论
	save_comment: function (selector)
	{
	    selector.attr('_onclick', selector.attr('onclick')).addClass('disabled').removeAttr('onclick').addClass('_save_comment');

	    AWS.ajax_post(selector.parents('form'), AWS.ajax_processer, 'comments_form');
	},

	// 删除评论
	remove_comment: function (selector, type, comment_id)
	{
		$.get(G_BASE_URL + '/question/ajax/remove_comment/type-' + type + '__comment_id-' + comment_id);
		
		selector.parents('.aw-comment-box li').fadeOut();
	},

	// 问题感谢
	question_thanks: function (selector, question_id)
	{
	    $.post(G_BASE_URL + '/question/ajax/question_thanks/', 'question_id=' + question_id, function (result)
	    {
	        if (result.errno != 1)
	        {
	            alert(result.err);
	        }
	        else if (result.rsm.action == 'add')
	        {
	            selector.html(selector.html().replace(_t('感谢'), _t('已感谢'))).removeAttr('onclick');
	        }
	        else
	        {
	            selector.html(selector.html().replace(_t('已感谢'), _t('感谢')));
	        }
	    }, 'json');
	},

	// 感谢回复者
	answer_user_rate: function (selector, type, answer_id)
	{
	    $.post(G_BASE_URL + '/question/ajax/question_answer_rate/', 'type=' + type + '&answer_id=' + answer_id, function (result)
	    {
	        if (result.errno != 1)
	        {
	            alert(result.err);
	        }
	        else if (result.errno == 1)
	        {
	            switch (type)
	            {
		            case 'thanks':
		                if (result.rsm.action == 'add')
		                {
		                    selector.html(selector.html().replace(_t('感谢'), _t('已感谢'))).removeAttr('onclick');
		                }
		                else
		                {
		                    selector.html(selector.html().replace(_t('已感谢'), _t('感谢')));
		                }
		                break;

		            case 'uninterested':
		                if (result.rsm.action == 'add')
		                {
		                    selector.html(_t('撤消没有帮助'));
		                }
		                else
		                {
		                    selector.html(_t('没有帮助'));
		                }
		                break;
	            }
	        }
	    }, 'json');
	},

	//赞成投票
	agree_vote: function (selector, answer_id)
	{
		$.post(G_BASE_URL + '/question/ajax/answer_vote/', 'answer_id=' + answer_id + '&value=1', function (result) {});
		
	    //判断是否投票过  
	    if (selector.find('.icon').hasClass('active'))
	    {
	    	selector.find('b').html(parseInt(selector.find('b').html()) - 1);

	    	selector.find('.icon').removeClass('active');
	    } 
	    else
	    {
	    	selector.find('b').html(parseInt(selector.find('b').html()) + 1);

	    	selector.parents('.mod-footer').find('a.answer_vote .icon').removeClass('active');

	    	selector.find('.icon').addClass('active');
	    }
	},

	//反对投票
	disagree_vote: function (selector, answer_id)
	{
	    $.post(G_BASE_URL + '/question/ajax/answer_vote/', 'answer_id=' + answer_id + '&value=-1', function (result) {});
	    
	    //判断是否赞同过
	    if (selector.parents('.mod-footer').find('.agree .icon').hasClass('active'))
	    {
	    	selector.parents('.mod-footer').find('.agree b').html(parseInt(selector.parents('.mod-footer').find('.agree b').html()) - 1);

	    	selector.parents('.mod-footer').find('.agree .icon').removeClass('active');

			selector.find('.icon').addClass('active');
	    }
	    else if (selector.find('.icon').hasClass('active'))
	    {
	    	selector.find('.icon').removeClass('active');
	    }
	    else
	    {
	    	selector.find('.icon').addClass('active');
	    }
	},

	// 文章赞同
	article_vote: function (selector, article_id, rating)
	{
		AWS.loading('show');
		
		if (selector.hasClass('active'))
		{
			var rating = 0;
		}
		
		$.post(G_BASE_URL + '/article/ajax/article_vote/', 'type=article&item_id=' + article_id + '&rating=' + rating, function (result) 
		{
			AWS.loading('hide');
			
			if (result.errno != 1)
		    {
		        AWS.alert(result.err);
		    }
		    else
		    {
		    	// 0第一次, 1赞同 -1反对
		    	if (rating == 0)
		    	{
		    		selector.parents('.aw-article-vote').find('b')

		    		selector.parents('.aw-article-vote').find('b').html(parseInt(selector.parents('.aw-article-vote').find('b').html()) + 1);

		    		selector.find('.icon').addClass('active');
		    	}
		    	else if (rating == 1)
		    	{
		    		if (selector.parents('.aw-article-vote').find('.icon-agree').hasClass('active'))
		    		{
		    			selector.parents('.aw-article-vote').find('b').html(parseInt(selector.parents('.aw-article-vote').find('b').html()) - 1);

		    			selector.find('.icon').removeClass('active');
		    		}
		    		else if (selector.parents('.aw-article-vote').find('.icon-disagree').hasClass('active'))
		    		{
		    			selector.parents('.aw-article-vote').find('b').html(parseInt(selector.parents('.aw-article-vote').find('b').html()) + 1);

		    			selector.parents('.aw-article-vote').find('.icon-disagree').removeClass('active');

		    			selector.find('.icon').addClass('active');
		    		}
		    		else
		    		{
		    			selector.parents('.aw-article-vote').find('b').html(parseInt(selector.parents('.aw-article-vote').find('b').html()) + 1);

		    			selector.find('.icon').addClass('active');
		    		}
		    	}
		    	else
		    	{
		    		if (selector.parents('.aw-article-vote').find('.icon-agree').hasClass('active'))
		    		{
		    			selector.parents('.aw-article-vote').find('b').html(parseInt(selector.parents('.aw-article-vote').find('b').html()) - 1);

		    			selector.parents('.aw-article-vote').find('.icon-agree').removeClass('active');

		    			selector.find('.icon').addClass('active');
		    		}
		    		else if (selector.parents('.aw-article-vote').find('.icon-disagree').hasClass('active'))
		    		{
		    			selector.parents('.aw-article-vote').find('.icon-disagree').removeClass('active');
		    		}
		    	}
		    }
		}, 'json');
	},

	//文章评论赞同
	article_comment_vote: function (selector, comment_id, rating)
	{
		AWS.loading('show');
		
		if (selector.hasClass('active'))
		{
			var rating = 0;
		}
		
		$.post(G_BASE_URL + '/article/ajax/article_vote/', 'type=comment&item_id=' + comment_id + '&rating=' + rating, function (result) 
		{
			AWS.loading('hide');
			
			if (result.errno != 1)
		    {
		        alert(result.err);
		    }
		    else
		    {
				if (rating == 0)
				{
					selector.html(selector.html().replace(_t('我已赞'), _t('赞'))).removeClass('active');

					selector.find('b').html(parseInt(selector.find('b').html()) - 1);
				}
				else
				{
					selector.html(selector.html().replace(_t('赞'), _t('我已赞'))).addClass('active');

					selector.find('b').html(parseInt(selector.find('b').html()) + 1);
				}
		    }
		}, 'json');
	}
}

AWS.Dropdown = 
{
	// 下拉菜单功能绑定
	bind_dropdown_list: function(element, type)
	{
		var ul = $(element).parent().find('.aw-dropdown-list ul');
		
		$(element).keydown(function()
		{
			if (AWS.G.aw_dropdown_list_flag == 0)
			{
				AWS.G.aw_dropdown_list_interval = setInterval(function()
				{
					if ($(element).val().length >= 2)
					{
						switch (type)
						{
							case 'search' : 
								ul = $('#search_result');
								$.get(G_BASE_URL + '/search/ajax/search/?q=' + encodeURIComponent($(element).val()) + '&limit=5',function(result)
								{
									if (result.length > 0)
									{
										ul.html('');
										
										$.each(result, function(i, e)
										{
											switch(result[i].type)
											{
												case 'questions' :
													ul.append('<li class="question"><a href="' + decodeURIComponent(result[i].url) + '">' + result[i].name + '<span class="pull-right color-999">' + result[i].detail.answer_count + ' 个回答</span></a></li>');
													break;
													
												case 'articles' :
													ul.append('<li class="question"><a href="' + decodeURIComponent(result[i].url) + '">' + result[i].name + '<span class="pull-right color-999">' + result[i].detail.comments + ' 个评论</span></a></li>');
													break;

												case 'topics' :
													ul.append('<li class="topic"><span class="topic-tag"><a class="text" href="' + decodeURIComponent(result[i].url) + '">' + result[i].name  + '</a></span>&nbsp;<span class="color-999">' + result[i].detail.discuss_count + ' 个问题</span></li>');
													break;

												case 'users' :
													ul.append('<li class="user"><a href="' + decodeURIComponent(result[i].url) + '"><img class="img" width="25" src="' + result[i].detail.avatar_file + '" /> <span>' + result[i].name + '</span></a></li>');
													break;
											}
										});
										
										ul.show();
										$('.aw-search-result-box .result-mod .all-result').show();
										$('.aw-search-result-box .result-mod .mod-head, .aw-search-result-box .result-mod .tips').hide();
									}else
									{
										ul.hide();
										$('.aw-search-result-box .result-mod .all-result').hide();
										$('.aw-search-result-box .tips').show();
									}
								},'json');
							break;

							case 'message' :
								$.get(G_BASE_URL + '/search/ajax/search/?type=users&q=' + encodeURIComponent($(element).val()) + '&limit=10',function(result)
								{
									if (result.length > 0)
									{
										ul.html('');
										$.each(result ,function(i, e)
										{
											ul.append('<li><a><img src="' + result[i].detail.avatar_file + '"><span>' + result[i].name + '</span></a></li>')
										});	
										$('.alert-message .dropdown-list ul li a').click(function()
										{
											$(element).val($(this).text());
											$(element).next().hide();
										});
										
										$(element).next().show();
									}else
									{
										$(element).next().hide();
									}
								},'json');
							break;

							case 'invite' : 

								ul = $('.aw-invite-box ul');

								$.get(G_BASE_URL + '/search/ajax/search/?type=users&q=' + encodeURIComponent($(element).val()) + '&limit=10',function(result)
								{
									if (result.length > 0)
									{
										ul.html('');
										
										$.each(result ,function(i, e)
										{
											ul.append('<li><a data-id="' + result[i].uid + '" data-value="' + result[i].name + '"><img class="img" width="25" src="' + result[i].detail.avatar_file + '"> ' + result[i].name + '</a></li>')
										});

										$('.aw-invite-box ul li a').click(function()
										{
											AWS.User.invite_user($(this),$(this).parents('li').find('img').attr('src'));
										});
										
										$(element).parent().find('.aw-dropdown-list').show();

										ul.show();
									}else
									{
										$(element).parent().find('.aw-dropdown-list').hide();
									}
								},'json');
							break;

							case 'redirect' :
								$.get(G_BASE_URL + '/search/ajax/search/?q=' + encodeURIComponent($(element).val()) + '&type=questions&limit-30',function(result)
								{
									if (result.length > 0)
									{
										ul.html('');
										
										$.each(result ,function(i, e)
										{
											ul.append('<li><a onclick="AWS.ajax_request(' + "'" + G_BASE_URL + "/question/ajax/redirect/', 'item_id=" + $(element).attr('data-id') + "&target_id=" + result[i].search_id + "'" +')">' + result[i].name +'</a></li>')
										});	
										
										$(element).next().show();
									}else
									{
										$(element).next().hide();
									}
								},'json');
							break;

							case 'topic' :
								$.get(G_BASE_URL + '/search/ajax/search/?type=topics&q=' + encodeURIComponent($(element).val()) + '&limit=10',function(result)
								{
									if (result.length > 0)
									{
										ul.html('');
										
										$.each(result ,function(i, e)
										{
											ul.append('<li><a>' + result[i].name +'</a></li>')
										});	

										ul.find('li').click(function()
										{
											$(this).parents('.aw-topic-bar').find('.topic-text').val($(this).text());
											$(this).parents('.aw-topic-bar').find('.add').click();
										});
										
										$(element).parent().find('.aw-dropdown-list').show();

										ul.show();
									}else
									{
										$(element).parent().find('.aw-dropdown-list').hide();
									}
								},'json');
								
							break;
						}
					}
					else
					{
						$(element).next().hide();
					}
				},1000);

				switch (type)
				{
					case 'message' :
						$('.alert-message .dropdown-list ul li').click(function()
						{
							$(element).val($(this).find('span').html());
							$(element).next().hide();
						});
					break;
				}
				AWS.G.aw_dropdown_list_flag = 1;
			}
		});
		
		$(element).blur(function()
		{
			clearInterval(AWS.G.aw_dropdown_list_interval);
			
			AWS.G.aw_dropdown_list_flag = 0;
		});
	},

	// 插入下拉菜单
	set_dropdown_list: function (selecter, data, selected)
	{
	    $(selecter).append(Hogan.compile(AW_MOBILE_TEMPLATE.dropdownList).render(
	    {
	        'items': data
	    }));

	    $(selecter + ' .dropdown-menu li a').click(function ()
	    {
	        $('.aw-publish-dropdown span').html($(this).text());
	    });

	    if (selected)
	    {
	        $(selecter + " .dropdown-menu li a[data-value='" + selected + "']").click();
	    }
	}
}

AWS.Editor = 
{
	insert_attach: function (selector, attach_id, attach_tag)
	{
	    selector.parents('form').find('.textarea_content').insertAtCaret("\n[" + attach_tag + "]" + attach_id + "[/" + attach_tag + "]\n");
	}
}

AWS.Message = 
{
	// 检测通知
	check_notifications: function()
	{
		// 检测登录状态
	    if (G_USER_ID == 0)
	    {
	    	clearInterval(AWS.G.notification_timer);
	        return false;
	    }

	    $.get(G_BASE_URL + '/home/ajax/notifications/', function (result)
	    {
	        $('#inbox_unread').html(Number(result.rsm.inbox_num));

	        var last_unread_notification = G_UNREAD_NOTIFICATION;

	        G_UNREAD_NOTIFICATION = Number(result.rsm.notifications_num);

	        if (G_UNREAD_NOTIFICATION > 0)
	        {
	            if (G_UNREAD_NOTIFICATION != last_unread_notification)
	            {
	            	// 加载消息列表
	                AWS.Message.load_notification_list();

	                // 给导航label添加未读消息数量
	                $('#notifications_unread').html(G_UNREAD_NOTIFICATION);
	            }

	            document.title = '(' + (Number(result.rsm.notifications_num) + Number(result.rsm.inbox_num)) + ') ' + document_title;

	            $('#notifications_unread').show();
	        }
	        else
	        {
	            if ($('#header_notification_list').length)
	            {
	                $("#header_notification_list").html('<p style="padding: 0" align="center">' + _t('没有未读通知') + '</p>');
	            }

	            if ($("#index_notification").length)
	            {
	                $("#index_notification").fadeOut();
	            }

	            document.title = document_title;

	            $('#notifications_unread').hide();
	        }

	        // 私信
	        if (Number(result.rsm.inbox_num) > 0)
	        {
	            $('#inbox_unread').show();
	        }
	        else
	        {
	            $('#inbox_unread').hide();
	        }

	    }, 'json');
	},

	// 阅读通知
	read_notification: function(selector, notification_id , reload)
	{
	    if (notification_id)
	    {
	        selector.remove();

	        var url = G_BASE_URL + '/notifications/ajax/read_notification/notification_id-' + notification_id;
	    }
	    else
	    {
	        if ($("#index_notification").length)
	        {
	            $("#index_notification").fadeOut();
	        }

	        var url = G_BASE_URL + '/notifications/ajax/read_notification/';
	    }

	    $.get(url, function (result)
	    {
	        AWS.Message.check_notifications();

	        if (reload)
	        {
	            window.location.reload();
	        }
	    });
	},

	// 重新加载通知列表
	load_notification_list: function()
	{
	    if ($("#index_notification").length)
	    {
	    	// 给首页通知box内label添加未读消息数量
	        $("#index_notification").fadeIn().find('[name=notification_unread_num]').html(G_UNREAD_NOTIFICATION);

	        $('#index_notification ul#notification_list').html('<p align="center" style="padding: 15px 0"><img src="' + G_STATIC_URL + '/common/loading_b.gif"/></p>');

	        $.get(G_BASE_URL + '/notifications/ajax/list/flag-0__page-0', function (result)
	        {
	            $('#index_notification ul#notification_list').html(result);

	            AWS.Message.notification_show(5);
	        });
	    }

	    if ($("#header_notification_list").length)
	    {
	        $.get(G_BASE_URL + '/notifications/ajax/list/flag-0__limit-5__template-header_list', function (result)
	        {
	            if (result.length)
	            {
	                $("#header_notification_list").html(result);
	            }
	            else
	            {
	                $("#header_notification_list").html('<p style="padding: 0" align="center">' + _t('没有未读通知') + '</p>');
	            }
	        });
	    }
	},

	// 控制通知数量
	notification_show: function(length)
	{
	    if ($('#index_notification').length > 0)
	    {
	    	if ($('#index_notification ul#notification_list li').length == 0)
	        {
	            $('#index_notification').fadeOut();
	        }
	        else
	        {
	        	$('#index_notification ul#notification_list li').each(function (i, e)
		        {
		            if (i < length)
		            {
		                $(e).show();
		            }
		            else
		            {
		                $(e).hide();
		            }
		        });
	        }
	    }
	}
}

AWS.Init = 
{
	init_topic_edit_box: function (selector, type)
	{
		$(selector).click(function()
		{
			$(this).parents('.aw-topic-bar').addClass('active');

			var data_id = $(this).parents('.aw-topic-bar').attr('data-id'),
				data_type;
			if (type)
			{
				data_type = type;
			}
			else
			{
				data_type = $(this).parents('.aw-topic-bar').attr('data-type');
			}

			$(selector).hide();

			$(selector).parents('.aw-topic-bar').append(AW_MOBILE_TEMPLATE.topic_edit_box);

			$.each($(selector).parents('.aw-topic-bar').find('.topic-tag'), function (i, e)
			{
				if (!$(e).has('i')[0])
				{
					$(e).append('<a href="#" class="close"><i class="icon icon-delete"></i></a>');
				}
			});

			AWS.Dropdown.bind_dropdown_list('.aw-topic-bar input','topic');

			/* 话题编辑添加按钮 */
			$('.aw-topic-bar .add').click(function()
			{
				switch (data_type)
				{
					case 'publish' :
						if ($(this).parents('.aw-topic-bar').find('.topic-text').val() != '')
						{
							$(this).parents('.aw-topic-bar').find('.tag-bar').prepend('<span class="topic-tag"><a class="text">' + $(this).parents('.aw-topic-bar').find('.topic-text').val() + '</a><input type="hidden" name="topics[]" value="' + $(this).parents('.aw-topic-bar').find('.topic-text').val() + '" ><a class="close" onclick="$(this).parents(\'.topic-tag\').detach();"><i class="icon icon-delete"></i></a>');
							$(this).parents('.aw-topic-bar').find('.topic-text').val('');
						}
					break;
					case 'question' :
						var _this = $(this);
						$.post(G_BASE_URL + '/topic/ajax/save_topic_relation/', 'type=question&item_id=' + data_id + '&topic_title=' + encodeURIComponent($(this).parents('.aw-topic-bar').find('.topic-text').val()), function(result)
						{
							if (result.errno == 1)
							{
								_this.parents('.aw-topic-bar').find('.tag-bar').prepend('<span class="topic-tag" data-id="'+ result.rsm.topic_id +'"><a class="text">' + _this.parents('.aw-topic-bar').find('.topic-text').val() + '</a><a class="close"><i class="icon icon-delete"></i></a></span>');
								_this.parents('.aw-topic-bar').find('.topic-text').val('');
							}else
							{
								alert(result.err);
							}
						}, 'json');
					break;
					case 'article' :
						var _this = $(this);
						$.post(G_BASE_URL + '/topic/ajax/save_topic_relation/', 'type=article&item_id=' + data_id + '&topic_title=' + encodeURIComponent($(this).parents('.aw-topic-bar').find('.topic-text').val()), function (result)
						{
							if (result.errno == 1)
							{
								_this.parents('.aw-topic-bar').find('.tag-bar').prepend('<span class="topic-tag" data-id="'+ result.rsm.topic_id +'"><a class="text">' + _this.parents('.aw-topic-bar').find('.topic-text').val() + '</a><a class="close"><i class="icon icon-delete"></i></a></span>');
								_this.parents('.aw-topic-bar').find('.topic-text').val('');
							}else
							{
								alert(result.err);
							}
						}, 'json');
					break;
				}
				$(this).parents('.aw-topic-bar').find('.aw-dropdown-list').hide();
			});

			/* 话题编辑取消按钮 */
			$('.aw-topic-bar .cancel').click(function()
			{
				$(this).parents('.aw-topic-bar').find('.aw-add-topic-box').show();
				$.each($(this).parents('.aw-topic-bar').find('.topic-tag'), function (i, e)
				{
					if ($(e).has('.close')[0])
					{
						$(e).find('.close').detach();
					}
				});
				$(this).parents('.aw-topic-bar').removeClass('active');
				$(this).parents('.editor').detach();
			});
		});
	},

	init_fileuploader: function (selector, action_url)
	{
	    if (!document.getElementById(selector))
	    {
	        return false;
	    }
	    
	    // if (G_UPLOAD_ENABLE == 'Y')
	    // {
	    // 	$('.aw-upload-tips').show();
	    // }

	    return new _ajax_uploader.FileUploader(
	    {
	        element: document.getElementById(selector),
	        action: action_url,
	        debug: false
	    });
	},

	init_comment_box: function (selector)
	{
	    $(document).on('click', selector, function ()
	    {
	        if (!$(this).attr('data-type') || !$(this).attr('data-id'))
	        {
	            return true;
	        }

	        var comment_box_id = '#aw-comment-box-' + $(this).attr('data-type') + '-' + 　$(this).attr('data-id');
			
	        if ($(comment_box_id).length > 0)
	        {
	            if ($(comment_box_id).css('display') == 'none')
	            {
	                $(comment_box_id).fadeIn();
	            }
	            else
	            {
	                $(comment_box_id).fadeOut();
	            }
	        }
	        else
	        {
	            // 动态插入commentBox
	            switch ($(this).attr('data-type'))
	            {
		            case 'question':
		                var comment_form_action = G_BASE_URL + '/question/ajax/save_question_comment/question_id-' + $(this).attr('data-id');
		                var comment_data_url = G_BASE_URL + '/question/ajax/get_question_comments/question_id-' + $(this).attr('data-id') + '__template-m';
		                break;
		
		            case 'answer':
		                var comment_form_action = G_BASE_URL + '/question/ajax/save_answer_comment/answer_id-' + $(this).attr('data-id');
		                var comment_data_url = G_BASE_URL + '/question/ajax/get_answer_comments/answer_id-' + $(this).attr('data-id') + '__template-m';
		                break;
	            }

	            if (G_USER_ID && $(this).attr('data-close') != 'true')
	            {
	                $(this).parents('.mod-footer').append(Hogan.compile(AW_MOBILE_TEMPLATE.commentBox).render(
	                {
	                    'comment_form_id': comment_box_id.replace('#', ''),
	                    'comment_form_action': comment_form_action
	                }));
					
	                $(comment_box_id).find('.cancel').click(function ()
	                {
	                    $(comment_box_id).fadeOut();
	                });

	                $(comment_box_id).find('.aw-comment-txt').autosize();
	            }
	            else
	            {
	                $(this).parent().parent().append(Hogan.compile(AW_MOBILE_TEMPLATE.commentBoxClose).render(
	                {
	                    'comment_form_id': comment_box_id.replace('#', ''),
	                    'comment_form_action': comment_form_action
	                }));
	            }

	            //判断是否有评论数据
	            $.get(comment_data_url, function (result)
	            {
	                if ($.trim(result) == '')
	                {
	                    result = '<p align="center">' + _t('暂无评论') + '</p>';
	                }

	                $(comment_box_id).find('.aw-comment-list').html(result);
	            });

	            /*给三角形定位*/
	            $(comment_box_id).find('i').css('left', $(this).width()/2 + $(this).position().left);
	            $(comment_box_id).find('i.active').css('left', $(this).width()/2 + $(this).position().left - 1);
	        }
	    });
	},

	init_article_comment_box: function (selector)
	{
		$(document).on('click', selector, function ()
	    {
	        if ($(this).parents('.mod-footer').find('.aw-comment-box').length)
	        {
	            if ($(this).parents('.mod-footer').find('.aw-comment-box').css('display') == 'block')
	            {
	               $(this).parents('.mod-footer').find('.aw-comment-box').fadeOut();
	            }
	            else
	            {
	                $(this).parents('.mod-footer').find('.aw-comment-box').fadeIn();
	            }
	        }
	        else
	        {
	            $(this).parents('.mod-footer').append(Hogan.compile(AW_MOBILE_TEMPLATE.articleCommentBox).render(
	            {
	                'at_uid' : $(this).attr('data-id'),
	                'article_id' : $('.aw-replay-box input[name="article_id"]').val()
	            }));
	            $(this).parents('.mod-footer').find('.cancel').click(function ()
	            {
	                $(this).parents('.mod-footer').find('.aw-comment-box').fadeOut();
	            });
	            $(this).parents('.mod-footer').find('.aw-comment-txt').autosize();

	            /*给三角形定位*/
	            $(this).parents('.mod-footer').find('i').css('left', $(this).width()/2 + $(this).position().left);
	            $(this).parents('.mod-footer').find('i.active').css('left', $(this).width()/2 + $(this).position().left - 1);
	        }
	    });
	}
}

function _t(string, replace)
{
    if (typeof (aws_lang) != 'undefined')
    {
        if (typeof (aws_lang[string]) != 'undefined')
        {
            string = aws_lang[string];
        }
    }

    if (replace)
    {
        string = string.replace('%s', replace);
    }

    return string;
};

// jQuery扩展
(function ($){
	$.fn.extend(
    {
    	insertAtCaret: function (textFeildValue)
	    {
	        var textObj = $(this).get(0);
	        if (document.all && textObj.createTextRange && textObj.caretPos)
	        {
	            var caretPos = textObj.caretPos;
	            caretPos.text = caretPos.text.charAt(caretPos.text.length - 1) == '' ?
	                textFeildValue + '' : textFeildValue;
	        }
	        else if (textObj.setSelectionRange)
	        {
	            var rangeStart = textObj.selectionStart;
	            var rangeEnd = textObj.selectionEnd;
	            var tempStr1 = textObj.value.substring(0, rangeStart);
	            var tempStr2 = textObj.value.substring(rangeEnd);
	            textObj.value = tempStr1 + textFeildValue + tempStr2;
	            textObj.focus();
	            var len = textFeildValue.length;
	            textObj.setSelectionRange(rangeStart + len, rangeStart + len);
	            textObj.blur();
	        }
	        else
	        {
	            textObj.value += textFeildValue;
	        }
	    },

	    highText: function (searchWords, htmlTag, tagClass)
	    {
	        return this.each(function ()
	        {
	            $(this).html(function high(replaced, search, htmlTag, tagClass)
	            {
	                var pattarn = search.replace(/\b(\w+)\b/g, "($1)").replace(/\s+/g, "|");

	                return replaced.replace(new RegExp(pattarn, "ig"), function (keyword)
	                {
	                    return $("<" + htmlTag + " class=" + tagClass + ">" + keyword + "</" + htmlTag + ">").outerHTML();
	                });
	            }($(this).text(), searchWords, htmlTag, tagClass));
	        });
	    },
	    
	    outerHTML: function (s)
	    {
	        return (s) ? this.before(s).remove() : jQuery("<p>").append(this.eq(0).clone()).html();
	    }
    });

})(jQuery);